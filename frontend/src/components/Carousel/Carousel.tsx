import React from "react";
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './Carousel_module.css';

// import required modules
import { Navigation, Pagination, Mousewheel, Keyboard } from 'swiper';

const Carousel = ({ data, handelOnPromptGet }: { data?: [string, string | undefined][] | [string, string | undefined][][] | undefined | undefined, handelOnPromptGet?: (index: number) => void | undefined }) => {

    return (
        <>
            <Swiper
                cssMode={true}
                navigation={true}
                // pagination={true}
                spaceBetween={30}
                slidesPerView={1}
                mousewheel={true}
                keyboard={true}
                modules={[Navigation, Pagination, Mousewheel, Keyboard]}
                className={typeof data?.[0]?.[0] === 'object' ? "mySwiper" : "mySwiper1"}
                breakpoints={{
                    // when window width is >= 640px
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    // when window width is >= 768px
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    // when window width is >= 1024px
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 20
                    }
                }}
            >
                {data?.map((item, index) => {
                    console.log("🚀 ~ {data?.map ~ item:", typeof item?.[0], item?.[0], typeof item, item)
                    if (typeof item?.[0] === 'object') {
                        return (
                            <SwiperSlide key={index}>
                                {item?.[0] && <div className='chatGridTopSpace chatGridBottomSpace chatGridModel gradient-border-pseudo' onClick={() => handelOnPromptGet && handelOnPromptGet((index * 1) + index)}>
                                    <h1 className='chatGridStateTitle'>{item?.[0]?.[0]}</h1>
                                    <h2 className='chatGridStateSubtitle'>{item?.[0]?.[1]?.slice(0, 60)}</h2>
                                </div>}
                                {item?.[1] && <div className='chatGridTopSpace chatGridModel gradient-border-pseudo' onClick={() => handelOnPromptGet && handelOnPromptGet(((index + 1) * 1) + index)}>
                                    <h1 className='chatGridStateTitle'>{item?.[1]?.[0]}</h1>
                                    <h2 className='chatGridStateSubtitle'>{item?.[1]?.[1]?.slice(0, 60)}</h2>
                                </div>}
                            </SwiperSlide>
                        )
                    } else {
                        return (
                            <SwiperSlide key={index}>
                                <div className='chatGridModel gradient-border-pseudo' onClick={() => handelOnPromptGet && handelOnPromptGet(index)}>
                                    <h1 className='chatGridStateTitle'>{item?.[0]}</h1>
                                    <h2 className='chatGridStateSubtitle'>{item?.[1]}</h2>
                                </div>
                            </SwiperSlide>
                        )
                    }
                })}

            </Swiper>
        </>
    );
};

export default Carousel;