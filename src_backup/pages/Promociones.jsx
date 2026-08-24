import API_URL from '../api'
import { useEffect, useState } from 'react'


function Promociones() {

  const [products, setProducts] = useState([])
  const [promotions, setPromotions] = useState([])

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [promotionPrice, setPromotionPrice] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)


  // ========================================
  // CARGAR PRODUCTOS Y PROMOCIONES
  // ========================================

  useEffect(() => {
    loadData()
  }, [])


  async function loadData() {

    try {

      setLoading(true)

      const productsResponse = await fetch(
        `${API_URL}/api/products`
      )

      const promotionsResponse = await fetch(
        `${API_URL}/api/promotions`
      )


      if (!productsResponse.ok) {
        throw new Error(
          'No se pudieron cargar los productos.'
        )
      }


      if (!promotionsResponse.ok) {
        throw new Error(
          'No se pudieron cargar las promociones.'
        )
      }


      const productsData =
        await productsResponse.json()

      const promotionsData =
        await promotionsResponse.json()


      setProducts(
        Array.isArray(productsData)
          ? productsData
          : []
      )


      setPromotions(
        Array.isArray(promotionsData)
          ? promotionsData
          : []
      )


    } catch (error) {

      console.error(
        'Error cargando datos:',
        error
      )

      alert(
        error.message ||
        'No se pudieron cargar los datos.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ========================================
  // PRODUCTO SELECCIONADO
  // ========================================

  const selectedProduct =
    products.find(
      product =>
        Number(product.id) ===
        Number(productId)
    )


  // ========================================
  // FORMATO DE MONEDA
  // ========================================

  function formatCurrency(value) {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN'
      }
    ).format(
      Number(value) || 0
    )

  }


  // ========================================
  // CREAR PROMOCIÃ“N
  // ========================================

  async function handleCreatePromotion(event) {

    event.preventDefault()


    const numericProductId =
      Number(productId)

    const numericQuantity =
      Number(quantity)

    const numericPromotionPrice =
      Number(promotionPrice)


    // ======================================
    // VALIDAR PRODUCTO
    // ======================================

    if (
      !Number.isInteger(numericProductId) ||
      numericProductId <= 0
    ) {

      alert(
        'Selecciona un producto.'
      )

      return

    }


    // ======================================
    // VALIDAR CANTIDAD
    // ======================================

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 2
    ) {

      alert(
        'La promociÃ³n debe tener mÃ­nimo 2 piezas.'
      )

      return

    }


    // ======================================
    // VALIDAR PRECIO
    // ======================================

    if (
      !Number.isFinite(numericPromotionPrice) ||
      numericPromotionPrice <= 0
    ) {

      alert(
        'Ingresa un precio promocional vÃ¡lido.'
      )

      return

    }


    // ======================================
    // VALIDAR PRECIO NORMAL
    // ======================================

    if (selectedProduct) {

      const normalTotal =
        Number(selectedProduct.price || 0) *
        numericQuantity


      if (
        numericPromotionPrice >= normalTotal
      ) {

        alert(
          `El precio promocional debe ser menor al precio normal de ${numericQuantity} unidades (${formatCurrency(normalTotal)}).`
        )

        return

      }

    }


    try {

      setSaving(true)


      const response = await fetch(
        `${API_URL}/api/promotions`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            productId: numericProductId,
            quantity: numericQuantity,
            promotionPrice: numericPromotionPrice
          })
        }
      )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo crear la promociÃ³n.'
        )

      }


      alert(
        'PromociÃ³n creada correctamente.'
      )


      // Limpiar formulario

      setProductId('')
      setQuantity('')
      setPromotionPrice('')


      // Actualizar informaciÃ³n

      await loadData()


    } catch (error) {

      console.error(
        'Error creando promociÃ³n:',
        error
      )

      alert(
        error.message ||
        'No se pudo crear la promociÃ³n.'
      )

    } finally {

      setSaving(false)

    }

  }


  // ========================================
  // ACTIVAR / DESACTIVAR
  // ========================================

  async function togglePromotion(promotion) {

    try {

      const response = await fetch(
        `${API_URL}/api/promotions/${promotion.id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            active: !promotion.active
          })
        }
      )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo actualizar la promociÃ³n.'
        )

      }


      await loadData()


    } catch (error) {

      console.error(
        'Error actualizando promociÃ³n:',
        error
      )

      alert(
        error.message ||
        'No se pudo actualizar la promociÃ³n.'
      )

    }

  }


  // ========================================
  // ELIMINAR PROMOCIÃ“N
  // ========================================

  async function deletePromotion(promotion) {

    const confirmed =
      window.confirm(
        `Â¿Deseas eliminar la promociÃ³n de ${promotion.quantity} piezas por ${formatCurrency(promotion.promotionPrice)} de "${promotion.productName}"?`
      )


    if (!confirmed) {
      return
    }


    try {

      const response = await fetch(
        `${API_URL}/api/promotions/${promotion.id}`,
        {
          method: 'DELETE'
        }
      )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo eliminar la promociÃ³n.'
        )

      }


      alert(
        'PromociÃ³n eliminada correctamente.'
      )


      await loadData()


    } catch (error) {

      console.error(
        'Error eliminando promociÃ³n:',
        error
      )

      alert(
        error.message ||
        'No se pudo eliminar la promociÃ³n.'
      )

    }

  }


  // ========================================
  // CARGANDO
  // ========================================

  if (loading) {

    return (

      <section className="page">

        <h2>
          Promociones
        </h2>

        <p>
          Cargando promociones...
        </p>

      </section>

    )

  }


  // ========================================
  // PÃGINA
  // ========================================

  return (

    <section className="page">

      {/* ==================================
          ENCABEZADO
      ================================== */}

      <div className="page-header">

        <div>

          <p className="welcome">
            Ezra â€” Tienda de Plantas y DecoraciÃ³n
          </p>

          <h2>
            Promociones
          </h2>

          <p>
            Crea y administra promociones para tus productos.
          </p>

        </div>

      </div>


      {/* ==================================
          CONTENIDO
      ================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 0.8fr) minmax(0, 1.4fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >


        {/* =================================
            NUEVA PROMOCIÃ“N
        ================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                ðŸ·ï¸ Nueva promociÃ³n
              </h3>

              <p>
                Define la cantidad y el precio especial.
              </p>

            </div>

          </div>


          <form onSubmit={handleCreatePromotion}>


            {/* PRODUCTO */}

            <div className="form-group">

              <label>
                Producto
              </label>


              <select
                value={productId}
                onChange={event =>
                  setProductId(event.target.value)
                }
                disabled={saving}
              >

                <option value="">
                  Selecciona un producto
                </option>


                {products.map(product => (

                  <option
                    key={product.id}
                    value={product.id}
                  >

                    {product.name}
                    {' â€” '}
                    {formatCurrency(product.price)}

                  </option>

                ))}

              </select>

            </div>


            {/* INFORMACIÃ“N DEL PRODUCTO */}

            {selectedProduct && (

              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#f0fdf4'
                }}
              >

                <p>
                  <strong>
                    Precio normal:
                  </strong>{' '}

                  {formatCurrency(
                    selectedProduct.price
                  )}

                </p>


                <p>
                  <strong>
                    Existencias:
                  </strong>{' '}

                  {selectedProduct.stock}

                </p>

              </div>

            )}


            {/* CANTIDAD */}

            <div className="form-group">

              <label>
                Cantidad de piezas
              </label>


              <input
                type="number"
                min="2"
                step="1"
                value={quantity}
                onChange={event =>
                  setQuantity(event.target.value)
                }
                placeholder="Ej. 2"
                disabled={saving}
              />

            </div>


            {/* PRECIO PROMOCIONAL */}

            <div className="form-group">

              <label>
                Precio promocional
              </label>


              <input
                type="number"
                min="0.01"
                step="0.01"
                value={promotionPrice}
                onChange={event =>
                  setPromotionPrice(event.target.value)
                }
                placeholder="Ej. 60.00"
                disabled={saving}
              />

            </div>


            {/* VISTA PREVIA */}

            {selectedProduct &&
              quantity &&
              promotionPrice && (

                <div
                  style={{
                    marginBottom: '16px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid #ddd'
                  }}
                >

                  <strong>
                    Vista previa
                  </strong>


                  <p>

                    {quantity} piezas por{' '}

                    <strong>
                      {formatCurrency(
                        promotionPrice
                      )}
                    </strong>

                  </p>

                </div>

              )}


            {/* BOTÃ“N */}

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{
                width: '100%'
              }}
            >

              {saving
                ? 'Guardando...'
                : 'ðŸ·ï¸ Crear promociÃ³n'
              }

            </button>

          </form>

        </div>


        {/* =================================
            PROMOCIONES EXISTENTES
        ================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Promociones existentes
              </h3>

              <p>
                Administra tus promociones.
              </p>

            </div>

          </div>


          {promotions.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ðŸ·ï¸
              </div>

              <h3>
                No hay promociones
              </h3>

              <p>
                Crea tu primera promociÃ³n.
              </p>

            </div>

          ) : (

            <div>

              {promotions.map(promotion => {

                const normalTotal =
                  Number(promotion.normalPrice || 0) *
                  Number(promotion.quantity || 0)


                const saving =
                  normalTotal -
                  Number(promotion.promotionPrice || 0)


                return (

                  <div
                    key={promotion.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #ddd'
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '15px'
                      }}
                    >

                      <div>

                        <strong>
                          {promotion.productName}
                        </strong>


                        <p>

                          {promotion.quantity}
                          {' piezas por '}

                          <strong>
                            {formatCurrency(
                              promotion.promotionPrice
                            )}
                          </strong>

                        </p>


                        <small>

                          Precio normal:{' '}

                          {formatCurrency(
                            normalTotal
                          )}

                          {' | Ahorro: '}

                          {formatCurrency(
                            saving
                          )}

                        </small>

                      </div>


                      <strong>

                        {promotion.active
                          ? 'ðŸŸ¢ Activa'
                          : 'âšª Inactiva'
                        }

                      </strong>

                    </div>


                    {/* BOTONES */}

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px'
                      }}
                    >

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          togglePromotion(
                            promotion
                          )
                        }
                      >

                        {promotion.active
                          ? 'Desactivar'
                          : 'Activar'
                        }

                      </button>


                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          deletePromotion(
                            promotion
                          )
                        }
                      >

                        Eliminar

                      </button>

                    </div>

                  </div>

                )

              })}

            </div>

          )}

        </div>

      </div>

    </section>

  )

}


export default Promociones
