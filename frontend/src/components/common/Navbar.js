import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="bg-[#254E58] text-white py-4 font-poppins sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wide text-white">
              RESOLVESUITE
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-4">
            <Link to="/login">
              <button className="bg-[#FFDAB9] hover:bg-[#88BDBC] text-black hover:text-[#254E58] px-4 py-2 rounded-full font-semibold transition-all duration-300">
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className="bg-[#FFDAB9] hover:bg-[#88BDBC] text-black hover:text-[#254E58] px-4 py-2 rounded-full font-semibold transition-all duration-300">
                Sign Up
              </button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#88BDBC]">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <div className="mt-4 space-y-2">
              <Link to="/login" className="block">
                <button className="w-full bg-transparent border border-[#88BDBC] hover:bg-[#88BDBC] text-[#88BDBC] hover:text-[#254E58] px-4 py-2 rounded-full font-semibold transition-all duration-300">
                  Login
                </button>
              </Link>
              <Link to="/organisation-registration" className="block">
                <button className="w-full bg-[#88BDBC] hover:bg-[#6E6658] text-[#254E58] px-4 py-2 rounded-full font-semibold transition-all duration-300">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, mobile }) => (
  <Link
    to={to}
    className={`${
      mobile
        ? 'block py-2 text-[#88BDBC] hover:text-white'
        : 'text-[#88BDBC] hover:text-white transition-colors duration-300'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;