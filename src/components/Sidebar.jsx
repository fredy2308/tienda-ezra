function Sidebar({ currentPage, onNavigate }) {

  const menuItems = [
  {
    id: 'dashboard',
    icon: '📊',
    label: 'Dashboard',
  },

  {
    id: 'pos',
    icon: '🛒',
    label: 'Punto de venta',
  },

  {
    id: 'productos',
    icon: '🌱',
    label: 'Productos',
  },

  {
    id: 'promociones',
    icon: '🏷️',
    label: 'Promociones',
  },

  {
    id: 'inventario',
    icon: '📦',
    label: 'Inventario',
  },

  {
    id: 'compras',
    icon: '🧾',
    label: 'Compras',
  },

  {
    id: 'transformaciones',
    icon: '🌿',
    label: 'Transformaciones',
  },

  {
    id: 'gastos',
    icon: '💸',
    label: 'Gastos',
  },

  {
    id: 'cortes',
    icon: '📅',
    label: 'Cortes',
  },

  {
    id: 'reportes',
    icon: '📈',
    label: 'Reportes',
  },
]

  return (

    <aside className="sidebar">

      <div className="logo">

        <div className="logo-icon">
          🌿
        </div>

        <div>

          <h2>
            EZRA
          </h2>

          <span>
            Plantas & Decoración
          </span>

        </div>

      </div>


      <nav className="menu">

        {menuItems.map(item => (

          <button

            key={item.id}

            className={`menu-item ${
              currentPage === item.id
                ? 'active'
                : ''
            }`}

            onClick={() =>
              onNavigate(item.id)
            }

          >

            <span>
              {item.icon}
            </span>

            {item.label}

          </button>

        ))}

      </nav>


      <div className="sidebar-bottom">

        <button className="menu-item">

          <span>
            ⚙️
          </span>

          Configuración

        </button>

      </div>

    </aside>

  )

}


export default Sidebar