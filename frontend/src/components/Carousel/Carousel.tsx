import React from "react";
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './Carousel_module.css';

// import required modules
import { Navigation, Pagination, Mousewheel, Keyboard } from 'swiper';

const Carousel = ({ data, handelOnPromptGet }: { data?: [string, string | undefined][] | undefined, handelOnPromptGet?: (name: string) => void }) => {

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
                className="mySwiper"
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
                    return (
                        <SwiperSlide key={index}>
                            <div className='chatGridModel gradient-border-pseudo' onClick={() => handelOnPromptGet && handelOnPromptGet(item?.[0])}>
                                <h1 className='chatGridStateTitle'>{item?.[0]}</h1>
                                <h2 className='chatGridStateSubtitle'>{item?.[1]}</h2>
                            </div>
                        </SwiperSlide>
                    )
                })}

            </Swiper>
        </>
    );
};

export default Carousel;