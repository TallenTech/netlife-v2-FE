import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
    const navigate = useNavigate();

    const PolicySection = ({ title, children }) => (
        <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{title}</h2>
            <div className="prose prose-sm md:prose-lg text-gray-600 max-w-none">{children}</div>
        </section>
    );

    return (
        <>
            <Helmet>
                <title>Terms of Service - NetLife</title>
                <meta name="description" content="Terms of Service for NetLife services." />
            </Helmet>
            {/* Mobile Layout */}
            <div className="block md:hidden bg-white min-h-screen">
                <div className="p-6">
                    <header className="flex items-center mb-6 -ml-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ChevronLeft size={24} />
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900 ml-2">Terms of Service</h1>
                    </header>

                    <main className="pb-12">
                        <p className="text-sm text-gray-500 mb-6">Last updated: 2025-06-22</p>

                        <PolicySection title="1. Introduction">
                            <p>Welcome to NetLife (“Service”, “we”, “our”, “us”)! These Terms of Service (“Terms”, “Terms of Service”) govern your use of our application and website located at netlife.cc (together or individually “Service”) operated by Makerere University School of Public Health. Your agreement with us includes these Terms and our Privacy Policy (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound by them. If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at info@netlife.cc so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.</p>
                        </PolicySection>

                        <PolicySection title="2. Communications">
                            <p>By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at info@netlife.cc.</p>
                        </PolicySection>

                        <PolicySection title="3. Purchases">
                            <p>If you wish to purchase any product or service made available through Service (“Purchase”), you may be asked to supply certain information relevant to your Purchase including but not limited to, your credit or debit card number, the expiration date of your card, your billing address, and your shipping information. You represent and warrant that: (i) you have the legal right to use any card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete. We may employ the use of third party services for the purpose of facilitating payment and the completion of Purchases. By submitting your information, you grant us the right to provide the information to these third parties subject to our Privacy Policy. We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons. We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.</p>
                        </PolicySection>

                        <PolicySection title="4. Contests, Sweepstakes and Promotions">
                            <p>Any contests, sweepstakes or other promotions (collectively, “Promotions”) made available through Service may be governed by rules that are separate from these Terms of Service. If you participate in any Promotions, please review the applicable rules as well as our Privacy Policy. If the rules for a Promotion conflict with these Terms of Service, Promotion rules will apply.</p>
                        </PolicySection>

                        <PolicySection title="5. Fees">
                            <p>Some parts of the Service may be subject to fees. You will be notified of any applicable fees before you incur them. We reserve the right to change our fees at any time, upon notice to you if such change may affect your existing subscriptions. We will provide you with reasonable prior notice of any change in fees to give you an opportunity to terminate your contract before such change becomes effective.</p>
                        </PolicySection>

                        <PolicySection title="6. Refunds">
                            <p>We issue refunds for Contracts within 30 days of the original purchase of the Contract.</p>
                        </PolicySection>

                        <PolicySection title="7. Content">
                            <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (“Content”). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. By posting Content on or through the Service, You represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.</p>
                        </PolicySection>

                        <PolicySection title="8. Prohibited Uses">
                            <p>You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service: (i) In any way that violates any applicable national or international law or regulation. (ii) For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise. (iii) To transmit, or procure the sending of, any advertising or promotional material, including any “junk mail”, “chain letter,” “spam,” or any other similar solicitation. (iv) To impersonate or attempt to impersonate us, our employee, another user, or any other person or entity. (v) In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</p>
                        </PolicySection>

                        <PolicySection title="9. Analytics">
                            <p>We may use third-party Service Providers to monitor and analyze the use of our Service.</p>
                        </PolicySection>

                        <PolicySection title="10. No Use By Minors">
                            <p>Service is intended only for access and use by individuals at least fifteen (15) years old. By accessing or using Service, you warrant and represent that you are at least fifteen (15) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms.</p>
                        </PolicySection>

                        <PolicySection title="11. Accounts">
                            <p>When you create an account with us, you guarantee that you are above the age of 15, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service. You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your device. You agree to accept responsibility for any and all activities or actions that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
                        </PolicySection>

                        <PolicySection title="12. Intellectual Property">
                            <p>Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of NetLife and its licensors. Service is protected by copyright, trademark, and other laws of both foreign countries. Our trademarks may not be used in connection with any product or service without the prior written consent of NetLife.</p>
                        </PolicySection>

                        <PolicySection title="13. Copyright Policy">
                            <p>We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on Service infringes on the copyright or other intellectual property rights (“Infringement”) of any person or entity. If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to info@netlife.cc, with the subject line: “Copyright Infringement” and include in your claim a detailed description of the alleged Infringement.</p>
                        </PolicySection>

                        <PolicySection title="14. DMCA Notice and Procedure for Copyright Infringement Claims">
                            <p>You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the information required by 17 U.S.C. 512(c)(3). Our Copyright Agent for notice of claims of copyright infringement on or through the Service can be reached by email at info@netlife.cc.</p>
                        </PolicySection>

                        <PolicySection title="15. Error Reporting and Feedback">
                            <p>You may provide us either directly at info@netlife.cc or via third party sites and tools with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Service (“Feedback”). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) we may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) we are not under any obligation of confidentiality with respect to the Feedback.</p>
                        </PolicySection>

                        <PolicySection title="16. Links To Other Web Sites">
                            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites. You acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such third party web sites or services.</p>
                        </PolicySection>

                        <PolicySection title="17. Disclaimer Of Warranty">
                            <p>THESE SERVICES ARE PROVIDED BY US ON AN “AS IS” AND “AS AVAILABLE” BASIS. WE MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.</p>
                        </PolicySection>

                        <PolicySection title="18. Limitation Of Liability">
                            <p>EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF WE HAVE BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</p>
                        </PolicySection>

                        <PolicySection title="19. Termination">
                            <p>We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms. If you wish to terminate your account, you may simply discontinue using Service. All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.</p>
                        </PolicySection>

                        <PolicySection title="20. Governing Law">
                            <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Makerere University School of Public Health is based, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.</p>
                        </PolicySection>

                        <PolicySection title="21. Changes To Service">
                            <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.</p>
                        </PolicySection>

                        <PolicySection title="22. Amendments To Terms">
                            <p>We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically. Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.</p>
                        </PolicySection>

                        <PolicySection title="23. Waiver And Severability">
                            <p>No waiver by us of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of us to assert a right or provision under Terms shall not constitute a waiver of such right or provision. If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.</p>
                        </PolicySection>

                        <PolicySection title="24. Acknowledgement">
                            <p>BY USING SERVICE OR OTHER SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.</p>
                        </PolicySection>

                        <PolicySection title="25. Contact Us">
                            <p>Please send your feedback, comments, requests for technical support by email: <a href="mailto:info@netlife.cc" className="text-primary hover:underline">info@netlife.cc</a>.</p>
                        </PolicySection>
                    </main>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block bg-white min-h-screen">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    <header className="flex items-center mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
                            <ChevronLeft size={24} />
                        </Button>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                            <p className="text-sm text-gray-500 mt-2">Last updated: 2025-06-22</p>
                        </div>
                    </header>

                    <main className="prose prose-lg max-w-none">
                        <PolicySection title="1. Introduction">
                            <p>Welcome to NetLife ("Service", "we", "our", "us")! These Terms of Service ("Terms", "Terms of Service") govern your use of our application and website located at netlife.cc (together or individually "Service") operated by Makerere University School of Public Health. Your agreement with us includes these Terms and our Privacy Policy ("Agreements"). You acknowledge that you have read and understood Agreements, and agree to be bound by them. If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at info@netlife.cc so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.</p>
                        </PolicySection>

                        <PolicySection title="2. Communications">
                            <p>By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at info@netlife.cc.</p>
                        </PolicySection>

                        <PolicySection title="3. Purchases">
                            <p>If you wish to purchase any product or service made available through Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including but not limited to, your credit or debit card number, the expiration date of your card, your billing address, and your shipping information. You represent and warrant that: (i) you have the legal right to use any card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete. We may employ the use of third party services for the purpose of facilitating payment and the completion of Purchases. By submitting your information, you grant us the right to provide the information to these third parties subject to our Privacy Policy. We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons. We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.</p>
                        </PolicySection>

                        <PolicySection title="4. Contests, Sweepstakes and Promotions">
                            <p>Any contests, sweepstakes or other promotions (collectively, "Promotions") made available through Service may be governed by rules that are separate from these Terms of Service. If you participate in any Promotions, please review the applicable rules as well as our Privacy Policy. If the rules for a Promotion conflict with these Terms of Service, Promotion rules will apply.</p>
                        </PolicySection>

                        <PolicySection title="5. Fees">
                            <p>Some parts of the Service may be subject to fees. You will be notified of any applicable fees before you incur them. We reserve the right to change our fees at any time, upon notice to you if such change may affect your existing subscriptions. We will provide you with reasonable prior notice of any change in fees to give you an opportunity to terminate your contract before such change becomes effective.</p>
                        </PolicySection>

                        <PolicySection title="6. Refunds">
                            <p>We issue refunds for Contracts within 30 days of the original purchase of the Contract.</p>
                        </PolicySection>

                        <PolicySection title="7. Content">
                            <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. By posting Content on or through the Service, You represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.</p>
                        </PolicySection>

                        <PolicySection title="8. Prohibited Uses">
                            <p>You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service: (i) In any way that violates any applicable national or international law or regulation. (ii) For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise. (iii) To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation. (iv) To impersonate or attempt to impersonate us, our employee, another user, or any other person or entity. (v) In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</p>
                        </PolicySection>

                        <PolicySection title="9. Analytics">
                            <p>We may use third-party Service Providers to monitor and analyze the use of our Service.</p>
                        </PolicySection>

                        <PolicySection title="10. No Use By Minors">
                            <p>Service is intended only for access and use by individuals at least fifteen (15) years old. By accessing or using Service, you warrant and represent that you are at least fifteen (15) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms.</p>
                        </PolicySection>

                        <PolicySection title="11. Accounts">
                            <p>When you create an account with us, you guarantee that you are above the age of 15, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service. You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your device. You agree to accept responsibility for any and all activities or actions that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
                        </PolicySection>

                        <PolicySection title="12. Intellectual Property">
                            <p>Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of NetLife and its licensors. Service is protected by copyright, trademark, and other laws of both foreign countries. Our trademarks may not be used in connection with any product or service without the prior written consent of NetLife.</p>
                        </PolicySection>

                        <PolicySection title="13. Copyright Policy">
                            <p>We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on Service infringes on the copyright or other intellectual property rights ("Infringement") of any person or entity. If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to info@netlife.cc, with the subject line: "Copyright Infringement" and include in your claim a detailed description of the alleged Infringement.</p>
                        </PolicySection>

                        <PolicySection title="14. DMCA Notice and Procedure for Copyright Infringement Claims">
                            <p>You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the information required by 17 U.S.C. 512(c)(3). Our Copyright Agent for notice of claims of copyright infringement on or through the Service can be reached by email at info@netlife.cc.</p>
                        </PolicySection>

                        <PolicySection title="15. Error Reporting and Feedback">
                            <p>You may provide us either directly at info@netlife.cc or via third party sites and tools with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Service ("Feedback"). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) we may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) we are not under any obligation of confidentiality with respect to the Feedback.</p>
                        </PolicySection>

                        <PolicySection title="16. Links To Other Web Sites">
                            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites. You acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such third party web sites or services.</p>
                        </PolicySection>

                        <PolicySection title="17. Disclaimer Of Warranty">
                            <p>THESE SERVICES ARE PROVIDED BY US ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.</p>
                        </PolicySection>

                        <PolicySection title="18. Limitation Of Liability">
                            <p>EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF WE HAVE BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</p>
                        </PolicySection>

                        <PolicySection title="19. Termination">
                            <p>We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms. If you wish to terminate your account, you may simply discontinue using Service. All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.</p>
                        </PolicySection>

                        <PolicySection title="20. Governing Law">
                            <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Makerere University School of Public Health is based, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.</p>
                        </PolicySection>

                        <PolicySection title="21. Changes To Service">
                            <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.</p>
                        </PolicySection>

                        <PolicySection title="22. Amendments To Terms">
                            <p>We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically. Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.</p>
                        </PolicySection>

                        <PolicySection title="23. Waiver And Severability">
                            <p>No waiver by us of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of us to assert a right or provision under Terms shall not constitute a waiver of such right or provision. If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.</p>
                        </PolicySection>

                        <PolicySection title="24. Acknowledgement">
                            <p>BY USING SERVICE OR OTHER SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.</p>
                        </PolicySection>

                        <PolicySection title="25. Contact Us">
                            <p>Please send your feedback, comments, requests for technical support by email: <a href="mailto:info@netlife.cc" className="text-primary hover:underline">info@netlife.cc</a>.</p>
                        </PolicySection>
                    </main>
                </div>
            </div>
        </>
    );
};

export default TermsOfService;