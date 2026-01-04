import React from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Activity, GitPullRequest, MessageSquare, LayoutDashboard } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { ReactComponent as DashboardMockup } from '../assets/Dashboard-Mockup.svg'

// Features Data
const features = [
    {
        name: 'Customizable Workflows',
        description:
            'Tailor complaint workflows to align with your institution processes, ensuring efficiency and transparency.',
        icon: Workflow,
    },
    {
        name: 'User-Driven Complaint Tracking',
        description:
            'Provide real-time updates and keep users informed with dynamic progress tracking of their complaints.',
        icon: Activity,
    },
    {
        name: 'Escalation Matrix',
        description:
            'Automate escalations for unresolved complaints, guaranteeing accountability and timely resolutions.',
        icon: GitPullRequest,
    },
    {
        name: 'Comprehensive Feedback System',
        description:
            'Collect and analyze feedback post-resolution for continuous process improvement.',
        icon: MessageSquare,
    },
    {
        name: 'Admin Dashboard',
        description:
            'A robust dashboard offering detailed insights, analytics, and management of complaints.',
        icon: LayoutDashboard,
    },
];

const LandingPage = () => {
    return (
        <div className="bg-[#F4F7F7] text-[#112D32]">
            {/* Navigation */}
            <Navbar />
            {/* Hero Section */}
            <section className="relative bg-[#254E58] text-white overflow-hidden">
                {/* Content container */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32">
                    <div className="flex flex-col lg:flex-row items-center">
                        {/* Text content */}
                        <div className="w-full lg:w-1/2 lg:pr-12 mb-12 lg:mb-0 text-center lg:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                Bespoke Complaint Management for Education Sector
                            </h1>
                            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-[#88BDBC]">
                                ResolveSuite streamlines complaint handling with customizable workflows, real-time tracking, and automated escalation.
                            </p>
                            <div className="flex justify-center lg:justify-start">
                                <Link to="/organisation-registration">
                                    <button className="bg-[#FFA62B] hover:bg-[#FF9500] text-[#112D32] px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                                        Get Started Now
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Dashboard mockup */}
                        <div className="w-full lg:w-1/2 relative">
                            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-2 lg:p-4 transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
                                <DashboardMockup className="w-full h-auto rounded-xl shadow-inner" />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#88BDBC] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-[#FFA62B] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg className="w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0L48 8.86275C96 17.7255 192 35.451 288 48.9804C384 62.5098 480 71.7647 576 66.6667C672 61.5686 768 42.1176 864 39.7059C960 37.2941 1056 51.3725 1152 57.8431C1248 64.3137 1344 63.1373 1392 62.5490L1440 61.9608V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" fill="#F4F7F7" />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-[#F4F7F7]">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-base font-semibold tracking-wide text-[#FFA62B] uppercase font-poppins font-bold">Key Features</h2>
                        <p className="mt-2 text-3xl font-bold text-[#112D32] sm:text-4xl font-poppins font-bold">
                            Built for Universality & Efficiency
                        </p>
                        <p className="mt-4 text-lg text-[#254E58] font-roboto">
                            ResolveSuite provides educational institutions with an advanced complaint management system designed for efficiency, transparency, and accountability.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#88BDBC] text-[#112D32]">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-[#112D32] font-bold">{feature.name}</h3>
                                    <p className="mt-2 text-base text-[#254E58] font-roboto">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-[#88BDBC] py-16">
                <div className="container mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-[#112D32] mb-4 font-poppins font-bold">
                        Ready to Elevate Your Institution's Complaint Handling?
                    </h2>
                    <p className="text-lg text-[#254E58] mb-8 max-w-2xl mx-auto font-roboto">
                        Join leading institutions in revolutionizing their complaint management with ResolveSuite.
                    </p>
                    <Link to="/organisation-registration">
                        <button className="bg-[#FFA62B] hover:bg-[#FF9500] text-[#112D32] px-8 py-3 rounded-full font-semibold text-lg transition-transform transform hover:scale-105 font-poppins font-bold">
                            Register Your Institution
                        </button>
                    </Link>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="bg-[#254E58] text-white py-8">
                <div className="container mx-auto text-center px-4 sm:px-6 lg:px-8 font-poppins font-bold">
                    <p>&copy; {new Date().getFullYear()} ResolveSuite. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;