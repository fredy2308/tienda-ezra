import API_URL from '../api'
import { useEffect, useState } from 'react'


function Inventario() {

  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')


  // ========================================
  // CARGAR PRODUCTOS
  // ========================================

  const loadProducts = async () => {

    try {

      setLoading(true)

      setError('')


      const response =
        await fetch(
          `${API_URL}/api/products`
        )


      if (!response.ok) {

        throw new Error(
          'No se pudieron cargar los productos.'
        )

      }


      const data =
        await response.json()


      setProducts(data)

    } catch (error) {

      console.error(error)

      setError(
        'No fue posible conectar con el servidor.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ========================================
  // CARGAR AL ABRIR
  // ========================================

  useEffect(() => {

    loadProducts()

  }, [])


  // ========================================
  // CÃLCULOS
  // ========================================

  const totalProducts =
    products.length


  const totalUnits =
    products.reduce(

      (total, product) =>

        total +
        Number(product.stock || 0),

      0

    )


  const lowStockProducts =
    products.filter(

      product =>

        Number(product.stock || 0) <=
        Number(product.minimum_stock || 0)

    ).length


  // ========================================
  // RENDER
  // ========================================

  return (

    <section className="products-page">


      <div className="products-header">

        <div>

          <p className="welcome">
            Control de existencias
          </p>

          <h2>
            Inventario
          </h2>

          <p className="page-description">
            Controla entradas, salidas y existencias de tus productos.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={loadProducts}
        >
          ðŸ”„ Actualizar
        </button>

      </div>


      {/* =====================================
          RESUMEN
      ===================================== */}

      <div className="products-summary">


        <div>

          <span>
            Productos
          </span>

          <strong>
            {totalProducts}
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
            Productos con stock bajo
          </span>

          <strong>
            {lowStockProducts}
          </strong>

        </div>


      </div>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}


      {/* =====================================
          INVENTARIO
      ===================================== */}

      <div className="panel">


        <div className="panel-header">

          <div>

            <h3>
              Existencias actuales
            </h3>

            <p>
              Productos disponibles actualmente en tu inventario.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">

            <div className="empty-icon">
              â³
            </div>

            <h3>
              Cargando inventario...
            </h3>

          </div>

        ) : products.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ðŸ“¦
            </div>

            <h3>
              Inventario vacÃ­o
            </h3>

            <p>
              Cuando agregues productos aparecerÃ¡n aquÃ­.
            </p>

          </div>

        ) : (

          <div className="inventory-list">


            {products.map(product => {


              const stock =
                Number(product.stock || 0)


              const minimumStock =
                Number(
                  product.minimum_stock || 0
                )


              const isLowStock =
                stock <= minimumStock


              const inventoryValue =
                stock *
                Number(product.cost || 0)


              return (

                <div
                  className="inventory-item"
                  key={product.id}
                >


                  <div className="inventory-product">


                    <div className="inventory-icon">
                      ðŸŒ±
                    </div>


                    <div>

                      <h4>
                        {product.name}
                      </h4>

                      <span>
                        {product.category}
                      </span>

                    </div>


                  </div>


                  <div className="inventory-data">


                    <div>

                      <span>
                        Existencias
                      </span>

                      <strong>
                        {stock} {product.unit}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Costo
                      </span>

                      <strong>
                        $
                        {Number(
                          product.cost || 0
                        ).toFixed(2)}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Precio
                      </span>

                      <strong>
                        $
                        {Number(
                          product.price || 0
                        ).toFixed(2)}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Valor inventario
                      </span>

                      <strong>
                        $
                        {inventoryValue.toFixed(2)}
                      </strong>

                    </div>


                  </div>


                  <div>

                    {isLowStock ? (

                      <span className="stock-warning">
                        âš ï¸ Stock bajo
                      </span>

                    ) : (

                      <span className="stock-ok">
                        âœ“ Disponible
                      </span>

                    )}

                  </div>


                </div>

              )

            })}


          </div>

        )}


      </div>


    </section>

  )

}


export default Inventario
