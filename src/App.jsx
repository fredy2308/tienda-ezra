import { useState } from 'react'

import './App.css'

import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Inventario from './pages/Inventario'
import Compras from './pages/Compras'
import Transformaciones from './pages/Transformaciones'
import PuntoVenta from './pages/PuntoVenta'
import Gastos from './pages/Gastos'
import Cortes from './pages/Cortes'
import Reportes from './pages/Reportes'
import Promociones from './pages/Promociones'


function App() {

  const [currentPage, setCurrentPage] =
    useState('dashboard')


  function renderPage() {

    switch (currentPage) {

      case 'dashboard':
        return <Dashboard />


      case 'productos':
        return <Productos />


      case 'inventario':
        return <Inventario />


      case 'compras':
        return <Compras />


      case 'transformaciones':
        return <Transformaciones />


      case 'pos':
        return <PuntoVenta />


      case 'gastos':
        return <Gastos />


      case 'promociones':
        return <Promociones />


      case 'cortes':
        return <Cortes />


      case 'reportes':
        return <Reportes />


      default:
        return <Dashboard />

    }

  }


  return (

    <div className="app">

      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />


      <main className="main">

        <header className="header">

          <div>

            <p className="welcome">
              Bienvenido a
            </p>

            <h1>
              Tienda de Plantas y Decoración Ezra
            </h1>

          </div>


          <div className="header-actions">

            <div className="date">
              📅 Semana actual
            </div>


            <div className="user">
              👤
            </div>

          </div>

        </header>


        {renderPage()}

      </main>

    </div>

  )

}


export default App