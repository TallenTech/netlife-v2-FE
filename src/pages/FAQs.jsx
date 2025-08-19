import React from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AccordionItem = ({ title, children }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-4 text-left font-semibold text-gray-800"
            >
                <span>{title}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && <div className="pb-4 text-gray-600">{children}</div>}
        </div>
    );
};

const faqData = {
    "General": [
        { q: "What is NetLife?", a: "NetLife is a secure digital health platform that provides stigma-free access to health services, with a focus on privacy and user control." },
        { q: "Is my data safe?", a: "Yes, protecting your privacy is our top priority. We use encryption and offer features like anonymous mode and data deletion to keep your information secure." },
        { q: "How do I update my profile?", a: "You can update your personal information by navigating to the 'Account' tab and selecting the 'Profile' section." },
        { q: "Can I use NetLife for my family members?", a: "We are working on a feature to manage multiple profiles for dependents. Stay tuned for updates!" },
        { q: "How do I delete my account?", a: "You can permanently delete your account and all associated data from the 'Account Settings' tab under 'Account Actions'." }
    ],
    "Health Survey": [
        { q: "What is the purpose of the health survey?", a: "The health survey helps assess your health status and provides personalized recommendations for services and content. It's a key step to unlocking the full potential of NetLife." },
        { q: "How often should I take the survey?", a: "We recommend taking the health survey periodically to keep your health profile up-to-date, especially if there are changes in your lifestyle or health." },
        { q: "Are my survey answers private?", a: "Absolutely. Your survey responses are confidential. You can even set them to auto-delete after a certain period in your privacy settings." },
        { q: "Can I see my past survey results?", a: "Yes, you can view your health history, including past survey outcomes, in the 'History' tab." }
    ],
    "Services": [
        { q: "What kind of services can I request?", a: "You can request various health services such as HIV testing, PrEP/PEP consultations, STI screenings, and more. Check the 'Services' tab for a full list." },
        {
            q:
                "How do I request a service?", a: "Go to the 'Services' tab, select the service you need, and follow the on-screen instructions to submit your request securely."
        },
        { q: "Is the service delivery discreet?", a: "Yes, all our services are designed to be as discreet and confidential as possible, from request to delivery." },
        { q: "How can I track my service request?", a: "You can see the status of your service requests in the 'History' tab." }
    ],
    "Privacy": [
        { q: "What is 'Anonymous Mode'?", a: "Anonymous mode hides your personal identifying information within the app, allowing you to browse and interact with more privacy." },
        { q: "What is 'Fake Account Mode'?", a: "When enabled, this mode loads a generic, non-personalized dashboard. This is useful if you need to open the app in a non-private setting." },
        { q: "How does 'Silent Alerts' work?", a: "This feature disguises notifications to look like generic system messages (e.g., 'Weather update') to protect your privacy." },
        { q: "What is 'Data Purge'?", a: "The data purge option allows you to immediately erase all your personal and health data from our systems. This action is irreversible." }
    ],
    "Content": [
        { q: "What kind of videos are available?", a: "We offer a library of short, informative videos on various health topics, including HIV prevention, STIs, mental health, and wellness." },
        { q: "Is the content tailored to me?", a: "Yes, we recommend content based on your health interests and survey results to ensure it's relevant to you." },
        { q: "Can I download videos?", a: "Currently, videos can only be streamed within the app to ensure content is up-to-date and secure." },
        { q: "How often is new content added?", a: "We regularly update our content library with new videos and articles from trusted health experts." }
    ]
};

const FAQs = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet>
                <title>FAQs - NetLife</title>
                <meta name="description" content="Find answers to frequently asked questions about NetLife." />
            </Helmet>
            <div className="py-4 md:py-6 bg-gray-50 min-h-screen">
                <header className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
                        <p className="text-gray-500">Frequently Asked Questions</p>
                    </div>
                </header>

                <Tabs defaultValue="General" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                        <TabsTrigger value="General">General</TabsTrigger>
                        <TabsTrigger value="Health Survey">Survey</TabsTrigger>
                        <TabsTrigger value="Services">Services</TabsTrigger>
                        <TabsTrigger value="Privacy">Privacy</TabsTrigger>
                        <TabsTrigger value="Content">Content</TabsTrigger>
                    </TabsList>
                    {Object.entries(faqData).map(([category, faqs]) => (
                        <TabsContent key={category} value={category}>
                            <div className="bg-white p-4 mt-4 rounded-2xl border">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} title={faq.q}>
                                        <p>{faq.a}</p>
                                    </AccordionItem>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </>
    );
};

export default FAQs;