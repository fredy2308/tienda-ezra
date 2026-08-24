import { useEffect, useState } from 'react'

import ProductForm from '../components/ProductForm'
import ProductsTable from '../components/ProductsTable'


function Productos() {

  const [showForm, setShowForm] = useState(false)

  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')


  // ========================================
  // OBTENER PRODUCTOS DE LA BASE DE DATOS
  // ========================================

  async function loadProducts() {

    try {

      setLoading(true)

      const response = await fetch(
        'http://localhost:3001/api/products'
      )


      if (!response.ok) {

        throw new Error(
          'No se pudieron obtener los productos.'
        )

      }


      const data = await response.json()

      setProducts(data)

      setError('')

    } catch (error) {

      console.error(error)

      setError(
        'No se pudo conectar con la base de datos.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ========================================
  // CARGAR PRODUCTOS AL ABRIR LA PÁGINA
  // ========================================

  useEffect(() => {

    loadProducts()

  }, [])


  // ========================================
  // AGREGAR PRODUCTO
  // ========================================

  async function addProduct(product) {

    try {

      const response = await fetch(
        'http://localhost:3001/api/products',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: product.name,
            category: product.category,

            cost: product.cost,
            price: product.price,

            stock: product.stock,

            minimumStock:
              product.minimumStock || 0,

            unit:
              product.unit || 'pieza',
          }),
        }
      )


      if (!response.ok) {

        throw new Error(
          'No se pudo guardar el producto.'
        )

      }


      const savedProduct =
        await response.json()


      setProducts(currentProducts => [
        savedProduct,
        ...currentProducts,
      ])


      setShowForm(false)

      setError('')

    } catch (error) {

      console.error(error)

      alert(
        'No se pudo guardar el producto.'
      )

    }

  }


  // ========================================
  // ELIMINAR PRODUCTO
  // ========================================

  async function deleteProduct(id) {

    const confirmDelete =
      window.confirm(
        '¿Seguro que deseas eliminar este producto?'
      )


    if (!confirmDelete) {
      return
    }


    try {

      const response = await fetch(
        `http://localhost:3001/api/products/${id}`,
        {
          method: 'DELETE',
        }
      )


      if (!response.ok) {

        throw new Error(
          'No se pudo eliminar el producto.'
        )

      }


      setProducts(currentProducts =>
        currentProducts.filter(
          product => product.id !== id
        )
      )


    } catch (error) {

      console.error(error)

      alert(
        'No se pudo eliminar el producto.'
      )

    }

  }


  // ========================================
  // CÁLCULOS
  // ========================================

  const totalUnits =
    products.reduce(
      (total, product) =>
        total + Number(product.stock),
      0
    )


  const inventoryValue =
    products.reduce(
      (total, product) =>
        total +
        Number(product.cost) *
        Number(product.stock),
      0
    )


  function formatCurrency(value) {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
      }
    ).format(value)

  }


  // ========================================
  // PANTALLA DE CARGA
  // ========================================

  if (loading) {

    return (

      <section className="products-page">

        <div className="empty-state">

          <div className="empty-icon">
            🌿
          </div>

          <h3>
            Cargando productos...
          </h3>

          <p>
            Consultando la base de datos de Ezra.
          </p>

        </div>

      </section>

    )

  }


  // ========================================
  // PANTALLA
  // ========================================

  return (

    <section className="products-page">

      <div className="products-header">

        <div>

          <p className="welcome">
            Catálogo
          </p>

          <h2>
            Productos
          </h2>

          <p className="page-description">
            Administra tus plantas, decoración y artículos.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          + Nuevo producto
        </button>

      </div>


      {error && (

        <div
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: '#faeeee',
            color: '#b94a48',
            fontSize: '13px',
          }}
        >
          {error}
        </div>

      )}


      <div className="products-summary">

        <div>

          <span>
            Productos registrados
          </span>

          <strong>
            {products.length}
          </strong>

        </div>


        <div>

          <span>
            Unidades disponibles
          </span>

          <strong>
            {totalUnits}
          </strong>

        </div>


        <div>

          <span>
            Valor de inventario
          </span>

          <strong>
            {formatCurrency(inventoryValue)}
          </strong>

        </div>

      </div>


      <ProductsTable
        products={products}
        onDelete={deleteProduct}
      />


      {showForm && (

        <ProductForm
          onSave={addProduct}
          onCancel={() =>
            setShowForm(false)
          }
        />

      )}

    </section>

  )

}


export default Productos