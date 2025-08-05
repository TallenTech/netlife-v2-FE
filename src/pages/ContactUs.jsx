import React from 'react';
import { Helmet } from 'react-helmet';
import { Phone, Mail, MessageSquare, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
    const navigate = useNavigate();

    const contactDetails = [
        {
            icon: Phone,
            title: "Phone",
            value: "+256742500500",
            href: "tel:+256742500500"
        },
        {
            icon: Mail,
            title: "Email",
            value: "help@netlife.cc",
            href: "mailto:help@netlife.cc"
        },
        {
            icon: MessageSquare,
            title: "WhatsApp",
            value: "+256742500500",
            href: "https://wa.me/256742500500"
        },
        {
            icon: MapPin,
            title: "Address",
            value: "Crane Survey, Plot 212, Bomb Road, Wandegeya, Kampala"
        }
    ];

    return (
        <>
            <Helmet>
                <title>Contact Us - NetLife</title>
                <meta name="description" content="Get in touch with the NetLife team for support and inquiries." />
            </Helmet>
            <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
                <header className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
                        <p className="text-gray-500">We're here to help!</p>
                    </div>
                </header>

                <div className="space-y-4">
                    {contactDetails.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-2xl border flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <item.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                                {item.href ? (
                                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                        {item.value}
                                    </a>
                                ) : (
                                    <p className="text-gray-600 break-all">{item.value}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ContactUs;