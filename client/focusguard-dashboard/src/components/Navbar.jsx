import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/signup", label: "Sign Up" },
    { to: "/focus", label: "Focus Session" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md shadow-md px-8 py-4 flex justify-between items-center text-white font-semibold">
      <div className="text-2xl font-bold tracking-wide cursor-pointer select-none">
        <Link to="/">FaceGuard</Link>
      </div>
      <div className="space-x-8 text-lg hidden md:flex">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`hover:text-blue-400 transition-colors ${
              location.pathname === to ? "text-blue-400 underline" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
