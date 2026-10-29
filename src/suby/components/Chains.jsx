import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Chains = () => {
    const [vendorData, setVendorData] = useState([]);
    const [loading, setLoading] = useState(true);

    const vendorFirmHandler = async () => {
        try {
            const response = await fetch(`${API_URL}/vendor/all-vendors?order=desc`);
            const newData = await response.json();
            setVendorData(newData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        vendorFirmHandler();
    }, []);

    const handleScroll = (direction) => {
        const gallery = document.getElementById("chainGallery");
        if (!gallery) return;
        const amount = Math.max(240, gallery.clientWidth * 0.8);
        gallery.scrollTo({ left: gallery.scrollLeft + (direction === "left" ? -amount : amount), behavior: "smooth" });
    };

    return (
        <div className='mediaChainSection'>
            <h3 className='chainTitle'>Top restaurant chains in Hyderabad</h3>

            <div className="btnSection">
                <button type="button" aria-label="Scroll chains left" onClick={() => handleScroll("left")}>
                    <FaArrowLeft className='btnIcons' />
                </button>
                <button type="button" aria-label="Scroll chains right" onClick={() => handleScroll("right")}>
                    <FaArrowRight className='btnIcons' />
                </button>
            </div>

            <section className="chainSection" id="chainGallery" aria-busy={loading}>
                {loading && [0, 1, 2, 3, 4].map((i) => <div key={i} className="chainSkeleton skeleton" />)}
                {vendorData.vendors && vendorData.vendors.map((vendor) => (
                    <div className="vendorBox" key={vendor._id || vendor.firm[0]?._id}>
                        {vendor.firm.map((item) => (
                            <Link
                                to={`/products/${item._id}/${item.firmName}`}
                                className="link"
                                key={item._id}
                                aria-label={item.firmName}
                            >
                                <div className="firmImage">
                                    <img src={item.image} alt={item.firmName} loading="lazy" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Chains;
