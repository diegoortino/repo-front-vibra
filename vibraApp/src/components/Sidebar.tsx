import { useContext, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserContext } from "../context/currentUserContext";
import { Icons } from "../components/Icons";
import "./Sidebar.css";

export function Sidebar() {
  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");

  const { user } = context;

  // ✅ Hooks SIEMPRE primero, antes de cualquier early return
  const [collapsed, setCollapsed] = useState(true);

  const itemsTop = useMemo(
    () => [
      { to: "/", label: "Home", icon: <Icons.Home /> },
      { to: "/favorites", label: "Favs", icon: <Icons.Fav /> },
      { to: "/follows", label: "Subs", icon: <Icons.Subs /> },
    ],
    []
  );

  // Early return DESPUÉS de todos los hooks
  if (!user) return null;

  const userItem = {
    to: user?.id ? `/user/${user.id}` : "/a",
    label: "User",
    icon: <Icons.User />,
  };

  return (
    <nav className={`sidebar ${collapsed ? "collapsed" : "expanded"}`} aria-label="Primary">
      {/* Header / Toggle */}
      <div className="sidebar__top">
        <button
          className="toggle"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="brand">VIBRA</span>
      </div>

      {/* Nav */}
      <ul className="nav">
        {itemsTop.map(({ to, label, icon }) => (
          <li key={to} className="nav__li">
            <NavLink
              to={to}
              className={({ isActive }) => `nav__item ${isActive ? "active" : ""}`}
            >
              <span className="nav__icon">{icon}</span>
              <span className="nav__label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* User link en el footer */}
      <div className="sidebar__bottom">
        <NavLink
          to={userItem.to}
          className={({ isActive }) => `nav__item ${isActive ? "active" : ""}`}
        >
          <span className="nav__icon">{userItem.icon}</span>
          <span className="nav__label">{userItem.label}</span>
        </NavLink>
      </div>
    </nav>
  );
}
