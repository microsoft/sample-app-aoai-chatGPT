"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _without2 = _interopRequireDefault(require("lodash/without"));

var _isNil2 = _interopRequireDefault(require("lodash/isNil"));

var _isUndefined2 = _interopRequireDefault(require("lodash/isUndefined"));

var _invoke2 = _interopRequireDefault(require("lodash/invoke"));

var _isElement2 = _interopRequireDefault(require("lodash/isElement"));

var _isArray2 = _interopRequireDefault(require("lodash/isArray"));

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _includes2 = _interopRequireDefault(require("lodash/includes"));

var _reduce2 = _interopRequireDefault(require("lodash/reduce"));

var _eventStack = _interopRequireDefault(require("@semantic-ui-react/event-stack"));

var _clsx = _interopRequireDefault(require("clsx"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _reactPopper = require("react-popper");

var _shallowequal = _interopRequireDefault(require("shallowequal"));

var _lib = require("../../lib");

var _Portal = _interopRequireDefault(require("../../addons/Portal"));

var _positions = require("./lib/positions");

var _createReferenceProxy = _interopRequireDefault(require("./lib/createReferenceProxy"));

var _PopupContent = _interopRequireDefault(require("./PopupContent"));

var _PopupHeader = _interopRequireDefault(require("./PopupHeader"));

/**
 * A Popup displays additional information on top of a page.
 */
var Popup = /*#__PURE__*/function (_Component) {
  (0, _inheritsLoose2.default)(Popup, _Component);

  function Popup() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _Component.call.apply(_Component, [this].concat(args)) || this;
    _this.state = {};
    _this.open = false;
    _this.zIndexWasSynced = false;
    _this.triggerRef = /*#__PURE__*/_react.default.createRef();
    _this.elementRef = /*#__PURE__*/_react.default.createRef();

    _this.getPortalProps = function () {
      var portalProps = {};
      var _this$props = _this.props,
          on = _this$props.on,
          hoverable = _this$props.hoverable;
      var normalizedOn = (0, _isArray2.default)(on) ? on : [on];

      if (hoverable) {
        portalProps.closeOnPortalMouseLeave = true;
        portalProps.mouseLeaveDelay = 300;
      }

      if ((0, _includes2.default)(normalizedOn, 'hover')) {
        portalProps.openOnTriggerClick = false;
        portalProps.closeOnTriggerClick = false;
        portalProps.openOnTriggerMouseEnter = true;
        portalProps.closeOnTriggerMouseLeave = true; // Taken from SUI: https://git.io/vPmCm

        portalProps.mouseLeaveDelay = 70;
        portalProps.mouseEnterDelay = 50;
      }

      if ((0, _includes2.default)(normalizedOn, 'click')) {
        portalProps.openOnTriggerClick = true;
        portalProps.closeOnTriggerClick = true;
        portalProps.closeOnDocumentClick = true;
      }

      if ((0, _includes2.default)(normalizedOn, 'focus')) {
        portalProps.openOnTriggerFocus = true;
        portalProps.closeOnTriggerBlur = true;
      }

      return portalProps;
    };

    _this.hideOnScroll = function (e) {
      // Do not hide the popup when scroll comes from inside the popup
      // https://github.com/Semantic-Org/Semantic-UI-React/issues/4305
      if ((0, _isElement2.default)(e.target) && _this.elementRef.current.contains(e.target)) {
        return;
      }

      _this.setState({
        closed: true
      });

      _lib.eventStack.unsub('scroll', _this.hideOnScroll, {
        target: window
      });

      _this.timeoutId = setTimeout(function () {
        _this.setState({
          closed: false
        });
      }, 50);

      _this.handleClose(e);
    };

    _this.handleClose = function (e) {
      (0, _invoke2.default)(_this.props, 'onClose', e, (0, _extends2.default)({}, _this.props, {
        open: false
      }));
    };

    _this.handleOpen = function (e) {
      (0, _invoke2.default)(_this.props, 'onOpen', e, (0, _extends2.default)({}, _this.props, {
        open: true
      }));
    };

    _this.handlePortalMount = function (e) {
      (0, _invoke2.default)(_this.props, 'onMount', e, _this.props);
    };

    _this.handlePortalUnmount = function (e) {
      _this.positionUpdate = null;
      (0, _invoke2.default)(_this.props, 'onUnmount', e, _this.props);
    };

    _this.renderContent = function (_ref) {
      var popperPlacement = _ref.placement,
          popperRef = _ref.ref,
          update = _ref.update,
          popperStyle = _ref.style;
      var _this$props2 = _this.props,
          basic = _this$props2.basic,
          children = _this$props2.children,
          className = _this$props2.className,
          content = _this$props2.content,
          hideOnScroll = _this$props2.hideOnScroll,
          flowing = _this$props2.flowing,
          header = _this$props2.header,
          inverted = _this$props2.inverted,
          popper = _this$props2.popper,
          size = _this$props2.size,
          style = _this$props2.style,
          wide = _this$props2.wide;
      var contentRestProps = _this.state.contentRestProps;
      _this.positionUpdate = update;
      var classes = (0, _clsx.default)('ui', _positions.placementMapping[popperPlacement], size, (0, _lib.useKeyOrValueAndKey)(wide, 'wide'), (0, _lib.useKeyOnly)(basic, 'basic'), (0, _lib.useKeyOnly)(flowing, 'flowing'), (0, _lib.useKeyOnly)(inverted, 'inverted'), 'popup transition visible', className);
      var ElementType = (0, _lib.getElementType)(Popup, _this.props);
      var styles = (0, _extends2.default)({
        // Heads up! We need default styles to get working correctly `flowing`
        left: 'auto',
        right: 'auto',
        // This is required to be properly positioned inside wrapping `div`
        position: 'initial'
      }, style);

      var innerElement = /*#__PURE__*/_react.default.createElement(ElementType, (0, _extends2.default)({}, contentRestProps, {
        className: classes,
        style: styles,
        ref: _this.elementRef
      }), _lib.childrenUtils.isNil(children) ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, _PopupHeader.default.create(header, {
        autoGenerateKey: false
      }), _PopupContent.default.create(content, {
        autoGenerateKey: false
      })) : children, hideOnScroll && /*#__PURE__*/_react.default.createElement(_eventStack.default, {
        on: _this.hideOnScroll,
        name: "scroll",
        target: "window"
      })); // https://github.com/popperjs/popper-core/blob/f1f9d1ab75b6b0e962f90a5b2a50f6cfd307d794/src/createPopper.js#L136-L137
      // Heads up!
      // A wrapping `div` there is a pure magic, it's required as Popper warns on margins that are
      // defined by SUI CSS. It also means that this `div` will be positioned instead of `content`.


      return (0, _lib.createHTMLDivision)(popper || {}, {
        overrideProps: {
          children: innerElement,
          ref: popperRef,
          style: (0, _extends2.default)({
            // Fixes layout for floated elements
            // https://github.com/Semantic-Org/Semantic-UI-React/issues/4092
            display: 'flex'
          }, popperStyle)
        }
      });
    };

    return _this;
  }

  Popup.getDerivedStateFromProps = function getDerivedStateFromProps(props, state) {
    if (state.closed || state.disabled) return {};
    var unhandledProps = (0, _lib.getUnhandledProps)(Popup, props);
    var contentRestProps = (0, _reduce2.default)(unhandledProps, function (acc, val, key) {
      if (!(0, _includes2.default)(_Portal.default.handledProps, key)) acc[key] = val;
      return acc;
    }, {});
    var portalRestProps = (0, _pick2.default)(unhandledProps, _Portal.default.handledProps);
    return {
      contentRestProps: contentRestProps,
      portalRestProps: portalRestProps
    };
  };

  var _proto = Popup.prototype;

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var depsEqual = (0, _shallowequal.default)(this.props.popperDependencies, prevProps.popperDependencies);

    if (!depsEqual) {
      this.handleUpdate();
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    clearTimeout(this.timeoutId);
  };

  _proto.handleUpdate = function handleUpdate() {
    if (this.positionUpdate) this.positionUpdate();
  };

  _proto.render = function render() {
    var _this2 = this;

    var _this$props3 = this.props,
        context = _this$props3.context,
        disabled = _this$props3.disabled,
        eventsEnabled = _this$props3.eventsEnabled,
        offset = _this$props3.offset,
        pinned = _this$props3.pinned,
        popper = _this$props3.popper,
        popperModifiers = _this$props3.popperModifiers,
        position = _this$props3.position,
        positionFixed = _this$props3.positionFixed,
        trigger = _this$props3.trigger;
    var _this$state = this.state,
        closed = _this$state.closed,
        portalRestProps = _this$state.portalRestProps;

    if (closed || disabled) {
      return trigger;
    }

    var modifiers = [{
      name: 'arrow',
      enabled: false
    }, {
      name: 'eventListeners',
      options: {
        scroll: !!eventsEnabled,
        resize: !!eventsEnabled
      }
    }, {
      name: 'flip',
      enabled: !pinned
    }, {
      name: 'preventOverflow',
      enabled: !!offset
    }, {
      name: 'offset',
      enabled: !!offset,
      options: {
        offset: offset
      }
    }].concat(popperModifiers, [// We are syncing zIndex from `.ui.popup.content` to avoid layering issues as in SUIR we are using an additional
    // `div` for Popper.js
    // https://github.com/Semantic-Org/Semantic-UI-React/issues/4083
    {
      name: 'syncZIndex',
      enabled: true,
      phase: 'beforeRead',
      fn: function fn(_ref2) {
        var _popper$style;

        var state = _ref2.state;

        if (_this2.zIndexWasSynced) {
          return;
        } // if zIndex defined in <Popup popper={{ style: {} }} /> there is no sense to override it


        var definedZIndex = popper == null ? void 0 : (_popper$style = popper.style) == null ? void 0 : _popper$style.zIndex;

        if ((0, _isUndefined2.default)(definedZIndex)) {
          // eslint-disable-next-line no-param-reassign
          state.elements.popper.style.zIndex = window.getComputedStyle(state.elements.popper.firstChild).zIndex;
        }

        _this2.zIndexWasSynced = true;
      },
      effect: function effect() {
        return function () {
          _this2.zIndexWasSynced = false;
        };
      }
    }]);
    var referenceElement = (0, _createReferenceProxy.default)((0, _isNil2.default)(context) ? this.triggerRef : context);
    var mergedPortalProps = (0, _extends2.default)({}, this.getPortalProps(), portalRestProps);
    return /*#__PURE__*/_react.default.createElement(_Portal.default, (0, _extends2.default)({}, mergedPortalProps, {
      onClose: this.handleClose,
      onMount: this.handlePortalMount,
      onOpen: this.handleOpen,
      onUnmount: this.handlePortalUnmount,
      trigger: trigger,
      triggerRef: this.triggerRef
    }), /*#__PURE__*/_react.default.createElement(_reactPopper.Popper, {
      modifiers: modifiers,
      placement: _positions.positionsMapping[position],
      strategy: positionFixed ? 'fixed' : null,
      referenceElement: referenceElement
    }, this.renderContent));
  };

  return Popup;
}(_react.Component);

exports.default = Popup;
Popup.handledProps = ["as", "basic", "children", "className", "content", "context", "disabled", "eventsEnabled", "flowing", "header", "hideOnScroll", "hoverable", "inverted", "offset", "on", "onClose", "onMount", "onOpen", "onUnmount", "pinned", "popper", "popperDependencies", "popperModifiers", "position", "positionFixed", "size", "style", "trigger", "wide"];
Popup.propTypes = process.env.NODE_ENV !== "production" ? {
  /** An element type to render as (string or function). */
  as: _propTypes.default.elementType,

  /** Display the popup without the pointing arrow. */
  basic: _propTypes.default.bool,

  /** Primary content. */
  children: _propTypes.default.node,

  /** Additional classes. */
  className: _propTypes.default.string,

  /** Simple text content for the popover. */
  content: _lib.customPropTypes.itemShorthand,

  /** Existing element the pop-up should be bound to. */
  context: _propTypes.default.oneOfType([_propTypes.default.object, _lib.customPropTypes.refObject]),

  /** A disabled popup only renders its trigger. */
  disabled: _propTypes.default.bool,

  /** Enables the Popper.js event listeners. */
  eventsEnabled: _propTypes.default.bool,

  /** A flowing Popup has no maximum width and continues to flow to fit its content. */
  flowing: _propTypes.default.bool,

  /** Takes up the entire width of its offset container. */
  // TODO: implement the Popup fluid layout
  // fluid: PropTypes.bool,

  /** Header displayed above the content in bold. */
  header: _lib.customPropTypes.itemShorthand,

  /** Hide the Popup when scrolling the window. */
  hideOnScroll: _propTypes.default.bool,

  /** Whether the popup should not close on hover. */
  hoverable: _propTypes.default.bool,

  /** Invert the colors of the Popup. */
  inverted: _propTypes.default.bool,

  /**
   * Offset values in px unit to apply to rendered popup. The basic offset accepts an
   * array with two numbers in the form [skidding, distance]:
   * - `skidding` displaces the Popup along the reference element
   * - `distance` displaces the Popup away from, or toward, the reference element in the direction of its placement. A positive number displaces it further away, while a negative number lets it overlap the reference.
   *
   * @see https://popper.js.org/docs/v2/modifiers/offset/
   */
  offset: _propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.arrayOf(_propTypes.default.number)]),

  /** Events triggering the popup. */
  on: _propTypes.default.oneOfType([_propTypes.default.oneOf(['hover', 'click', 'focus']), _propTypes.default.arrayOf(_propTypes.default.oneOf(['hover', 'click', 'focus']))]),

  /**
   * Called when a close event happens.
   *
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onClose: _propTypes.default.func,

  /**
   * Called when the portal is mounted on the DOM.
   *
   * @param {null}
   * @param {object} data - All props.
   */
  onMount: _propTypes.default.func,

  /**
   * Called when an open event happens.
   *
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onOpen: _propTypes.default.func,

  /**
   * Called when the portal is unmounted from the DOM.
   *
   * @param {null}
   * @param {object} data - All props.
   */
  onUnmount: _propTypes.default.func,

  /** Disables automatic repositioning of the component, it will always be placed according to the position value. */
  pinned: _propTypes.default.bool,

  /** Position for the popover. */
  position: _propTypes.default.oneOf(_positions.positions),

  /** Tells `Popper.js` to use the `position: fixed` strategy to position the popover. */
  positionFixed: _propTypes.default.bool,

  /** A wrapping element for an actual content that will be used for positioning. */
  popper: _lib.customPropTypes.itemShorthand,

  /** An array containing custom settings for the Popper.js modifiers. */
  popperModifiers: _propTypes.default.array,

  /** A popup can have dependencies which update will schedule a position update. */
  popperDependencies: _propTypes.default.array,

  /** Popup size. */
  size: _propTypes.default.oneOf((0, _without2.default)(_lib.SUI.SIZES, 'medium', 'big', 'massive')),

  /** Custom Popup style. */
  style: _propTypes.default.object,

  /** Element to be rendered in-place where the popup is defined. */
  trigger: _propTypes.default.node,

  /** Popup width. */
  wide: _propTypes.default.oneOfType([_propTypes.default.bool, _propTypes.default.oneOf(['very'])])
} : {};
Popup.defaultProps = {
  disabled: false,
  eventsEnabled: true,
  on: ['click', 'hover'],
  pinned: false,
  popperModifiers: [],
  position: 'top left'
};
Popup.Content = _PopupContent.default;
Popup.Header = _PopupHeader.default;