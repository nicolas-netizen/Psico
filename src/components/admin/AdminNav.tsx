import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminNav: React.FC = () => {
  return (
    <nav className="bg-white rounded-lg p-4 mb-6">
      <ul className="flex space-x-8">
        <li>
          <NavLink
            to="/admin/tests"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Tests
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/plans"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Planes
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/baremo"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Gestión de Baremo
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/discount"
            className={({ isActive }) =>
              `text-sm font-medium ${
                isActive ? 'text-[#6366f1] border-b-2 border-[#6366f1]' : 'text-gray-500 hover:text-gray-700'
              } pb-2`
            }
          >
            Códigos de Descuento
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNav;
