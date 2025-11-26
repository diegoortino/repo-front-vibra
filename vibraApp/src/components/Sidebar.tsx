import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserContext } from "../context/currentUserContext";
import { Icons } from "../components/Icons";

export function Sidebar() {
  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");

  const { user } = context;
  const [collapsed, setCollapsed] = useState(true);

  if (!user) return null;

  const userTo = user.id ? `/user/${user.id}` : "/a";

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar__item ${isActive ? "active" : ""}`;

  return (
    <nav
      className={`sidebar ${collapsed ? "collapsed" : "expanded"}`}
      aria-label="Primary"
    >
      <ul className="sidebar__nav">

        {/* Toggle como un item más del menú */}
        <li
          className="sidebar__item"
          onClick={() => setCollapsed(v => !v)}
          role="button"
          aria-label="Toggle sidebar"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setCollapsed(v => !v)}
        >
          <span className="sidebar__icon">
            <Icons.Menu />
          </span>
          <span className="sidebar__label">Vibra</span>
        </li>

        {/* HOME */}
        <li>
          <NavLink to="/" className={navItemClass}>
            <span className="sidebar__icon"><Icons.Home /></span>
            <span className="sidebar__label">Home</span>
          </NavLink>
        </li>

        {/* FAVS */}
        <li>
          <NavLink to="/favorites" className={navItemClass}>
            <span className="sidebar__icon"><Icons.Heart /></span>
            <span className="sidebar__label">Favs</span>
          </NavLink>
        </li>

        {/* SUBS */}
        <li>
          <NavLink to="/follows" className={navItemClass}>
            <span className="sidebar__icon"><Icons.Subs /></span>
            <span className="sidebar__label">Subs</span>
          </NavLink>
        </li>

        {/* USER (último item del sidebar) */}
        <li>
          <NavLink to={userTo} className={navItemClass}>
            <span className="sidebar__icon"><Icons.User /></span>
            <span className="sidebar__label">User</span>
          </NavLink>
        </li>

      </ul>
    </nav>
  );
}
