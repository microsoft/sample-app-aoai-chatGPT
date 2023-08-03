import _extends from "@babel/runtime/helpers/esm/extends";
import _inheritsLoose from "@babel/runtime/helpers/esm/inheritsLoose";
import _without from "lodash-es/without";
import _isNil from "lodash-es/isNil";
import _isUndefined from "lodash-es/isUndefined";
import _invoke from "lodash-es/invoke";
import _isElement from "lodash-es/isElement";
import _isArray from "lodash-es/isArray";
import _pick from "lodash-es/pick";
import _includes from "lodash-es/includes";
import _reduce from "lodash-es/reduce";
import EventStack from '@semantic-ui-react/event-stack';
import cx from 'clsx';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Popper } from 'react-popper';
import shallowEqual from 'shallowequal';
import { eventStack, childrenUtils, createHTMLDivision, customPropTypes, getElementType, getUnhandledProps, SUI, useKeyOnly, useKeyOrValueAndKey } from '../../lib';
import Portal from '../../addons/Portal';
import { placementMapping, positions, positionsMapping } from './lib/positions';
import createReferenceProxy from './lib/createReferenceProxy';
import PopupContent from './PopupContent';
import PopupHeader from './PopupHeader';

/**
 * A Popup displays additional information on top of a page.
 */
var Popup = /*#__PURE__*/function (_Component) {
  _inheritsLoose(Popup, _Component);

  function Popup() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _Component.call.apply(_Component, [this].concat(args)) || this;
    _this.state = {};
    _this.open = false;
    _this.zIndexWasSynced = false;
    _this.triggerRef = /*#__PURE__*/React.createRef();
    _this.elementRef = /*#__PURE__*/React.createRef();

    _this.getPortalProps = function () {
      var portalProps = {};
      var _this$props = _this.props,
          on = _this$props.on,
          hoverable = _this$props.hoverable;
      var normalizedOn = _isArray(on) ? on : [on];

      if (hoverable) {
        portalProps.closeOnPortalMouseLeave = true;
        portalProps.mouseLeaveDelay = 300;
      }

      if (_includes(normalizedOn, 'hover')) {
        portalProps.openOnTriggerClick = false;
        portalProps.closeOnTriggerClick = false;
        portalProps.openOnTriggerMouseEnter = true;
        portalProps.closeOnTriggerMouseLeave = true; // Taken from SUI: https://git.io/vPmCm

        portalProps.mouseLeaveDelay = 70;
        portalProps.mouseEnterDelay = 50;
      }

      if (_includes(normalizedOn, 'click')) {
        portalProps.openOnTriggerClick = true;
        portalProps.closeOnTriggerClick = true;
        portalProps.closeOnDocumentClick = true;
      }

      if (_includes(normalizedOn, 'focus')) {
        portalProps.openOnTriggerFocus = true;
        portalProps.closeOnTriggerBlur = true;
      }

      return portalProps;
    };

    _this.hideOnScroll = function (e) {
      // Do not hide the popup when scroll comes from inside the popup
      // https://github.com/Semantic-Org/Semantic-UI-React/issues/4305
      if (_isElement(e.target) && _this.elementRef.current.contains(e.target)) {
        return;
      }

      _this.setState({
        closed: true
      });

      eventStack.unsub('scroll', _this.hideOnScroll, {
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
      _invoke(_this.props, 'onClose', e, _extends({}, _this.props, {
        open: false
      }));
    };

    _this.handleOpen = function (e) {
      _invoke(_this.props, 'onOpen', e, _extends({}, _this.props, {
        open: true
      }));
    };

    _this.handlePortalMount = function (e) {
      _invoke(_this.props, 'onMount', e, _this.props);
    };

    _this.handlePortalUnmount = function (e) {
      _this.positionUpdate = null;

      _invoke(_this.props, 'onUnmount', e, _this.props);
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
      var classes = cx('ui', placementMapping[popperPlacement], size, useKeyOrValueAndKey(wide, 'wide'), useKeyOnly(basic, 'basic'), useKeyOnly(flowing, 'flowing'), useKeyOnly(inverted, 'inverted'), 'popup transition visible', className);
      var ElementType = getElementType(Popup, _this.props);

      var styles = _extends({
        // Heads up! We need default styles to get working correctly `flowing`
        left: 'auto',
        right: 'auto',
        // This is required to be properly positioned inside wrapping `div`
        position: 'initial'
      }, style);

      var innerElement = /*#__PURE__*/React.createElement(ElementType, _extends({}, contentRestProps, {
        className: classes,
        style: styles,
        ref: _this.elementRef
      }), childrenUtils.isNil(children) ? /*#__PURE__*/React.createElement(React.Fragment, null, PopupHeader.create(header, {
        autoGenerateKey: false
      }), PopupContent.create(content, {
        autoGenerateKey: false
      })) : children, hideOnScroll && /*#__PURE__*/React.createElement(EventStack, {
        on: _this.hideOnScroll,
        name: "scroll",
        target: "window"
      })); // https://github.com/popperjs/popper-core/blob/f1f9d1ab75b6b0e962f90a5b2a50f6cfd307d794/src/createPopper.js#L136-L137
      // Heads up!
      // A wrapping `div` there is a pure magic, it's required as Popper warns on margins that are
      // defined by SUI CSS. It also means that this `div` will be positioned instead of `content`.

      return createHTMLDivision(popper || {}, {
        overrideProps: {
          children: innerElement,
          ref: popperRef,
          style: _extends({
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
    var unhandledProps = getUnhandledProps(Popup, props);

    var contentRestProps = _reduce(unhandledProps, function (acc, val, key) {
      if (!_includes(Portal.handledProps, key)) acc[key] = val;
      return acc;
    }, {});

    var portalRestProps = _pick(unhandledProps, Portal.handledProps);

    return {
      contentRestProps: contentRestProps,
      portalRestProps: portalRestProps
    };
  };

  var _proto = Popup.prototype;

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var depsEqual = shallowEqual(this.props.popperDependencies, prevProps.popperDependencies);

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

        if (_isUndefined(definedZIndex)) {
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
    var referenceElement = createReferenceProxy(_isNil(context) ? this.triggerRef : context);

    var mergedPortalProps = _extends({}, this.getPortalProps(), portalRestProps);

    return /*#__PURE__*/React.createElement(Portal, _extends({}, mergedPortalProps, {
      onClose: this.handleClose,
      onMount: this.handlePortalMount,
      onOpen: this.handleOpen,
      onUnmount: this.handlePortalUnmount,
      trigger: trigger,
      triggerRef: this.triggerRef
    }), /*#__PURE__*/React.createElement(Popper, {
      modifiers: modifiers,
      placement: positionsMapping[position],
      strategy: positionFixed ? 'fixed' : null,
      referenceElement: referenceElement
    }, this.renderContent));
  };

  return Popup;
}(Component);

Popup.handledProps = ["as", "basic", "children", "className", "content", "context", "disabled", "eventsEnabled", "flowing", "header", "hideOnScroll", "hoverable", "inverted", "offset", "on", "onClose", "onMount", "onOpen", "onUnmount", "pinned", "popper", "popperDependencies", "popperModifiers", "position", "positionFixed", "size", "style", "trigger", "wide"];
export { Popup as default };
Popup.propTypes = process.env.NODE_ENV !== "production" ? {
  /** An element type to render as (string or function). */
  as: PropTypes.elementType,

  /** Display the popup without the pointing arrow. */
  basic: PropTypes.bool,

  /** Primary content. */
  children: PropTypes.node,

  /** Additional classes. */
  className: PropTypes.string,

  /** Simple text content for the popover. */
  content: customPropTypes.itemShorthand,

  /** Existing element the pop-up should be bound to. */
  context: PropTypes.oneOfType([PropTypes.object, customPropTypes.refObject]),

  /** A disabled popup only renders its trigger. */
  disabled: PropTypes.bool,

  /** Enables the Popper.js event listeners. */
  eventsEnabled: PropTypes.bool,

  /** A flowing Popup has no maximum width and continues to flow to fit its content. */
  flowing: PropTypes.bool,

  /** Takes up the entire width of its offset container. */
  // TODO: implement the Popup fluid layout
  // fluid: PropTypes.bool,

  /** Header displayed above the content in bold. */
  header: customPropTypes.itemShorthand,

  /** Hide the Popup when scrolling the window. */
  hideOnScroll: PropTypes.bool,

  /** Whether the popup should not close on hover. */
  hoverable: PropTypes.bool,

  /** Invert the colors of the Popup. */
  inverted: PropTypes.bool,

  /**
   * Offset values in px unit to apply to rendered popup. The basic offset accepts an
   * array with two numbers in the form [skidding, distance]:
   * - `skidding` displaces the Popup along the reference element
   * - `distance` displaces the Popup away from, or toward, the reference element in the direction of its placement. A positive number displaces it further away, while a negative number lets it overlap the reference.
   *
   * @see https://popper.js.org/docs/v2/modifiers/offset/
   */
  offset: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.number)]),

  /** Events triggering the popup. */
  on: PropTypes.oneOfType([PropTypes.oneOf(['hover', 'click', 'focus']), PropTypes.arrayOf(PropTypes.oneOf(['hover', 'click', 'focus']))]),

  /**
   * Called when a close event happens.
   *
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onClose: PropTypes.func,

  /**
   * Called when the portal is mounted on the DOM.
   *
   * @param {null}
   * @param {object} data - All props.
   */
  onMount: PropTypes.func,

  /**
   * Called when an open event happens.
   *
   * @param {SyntheticEvent} event - React's original SyntheticEvent.
   * @param {object} data - All props.
   */
  onOpen: PropTypes.func,

  /**
   * Called when the portal is unmounted from the DOM.
   *
   * @param {null}
   * @param {object} data - All props.
   */
  onUnmount: PropTypes.func,

  /** Disables automatic repositioning of the component, it will always be placed according to the position value. */
  pinned: PropTypes.bool,

  /** Position for the popover. */
  position: PropTypes.oneOf(positions),

  /** Tells `Popper.js` to use the `position: fixed` strategy to position the popover. */
  positionFixed: PropTypes.bool,

  /** A wrapping element for an actual content that will be used for positioning. */
  popper: customPropTypes.itemShorthand,

  /** An array containing custom settings for the Popper.js modifiers. */
  popperModifiers: PropTypes.array,

  /** A popup can have dependencies which update will schedule a position update. */
  popperDependencies: PropTypes.array,

  /** Popup size. */
  size: PropTypes.oneOf(_without(SUI.SIZES, 'medium', 'big', 'massive')),

  /** Custom Popup style. */
  style: PropTypes.object,

  /** Element to be rendered in-place where the popup is defined. */
  trigger: PropTypes.node,

  /** Popup width. */
  wide: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['very'])])
} : {};
Popup.defaultProps = {
  disabled: false,
  eventsEnabled: true,
  on: ['click', 'hover'],
  pinned: false,
  popperModifiers: [],
  position: 'top left'
};
Popup.Content = PopupContent;
Popup.Header = PopupHeader;