import { useEffect, useState } from 'react'


function Compras() {

  const [purchases, setPurchases] = useState([])

  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)


  const [form, setForm] = useState({

    name: '',

    category: '',

    quantity: '',

    unitCost: '',

    price: '',

    minimumStock: '0',

    unit: 'pieza',

    notes: '',

  })


  // ========================================
  // CARGAR COMPRAS
  // ========================================

  async function loadPurchases() {

    try {

      setLoading(true)


      const response =
        await fetch(
          'http://localhost:3001/api/purchases'
        )


      if (!response.ok) {

        throw new Error(
          'No se pudieron cargar las compras.'
        )

      }


      const data =
        await response.json()


      setPurchases(
        Array.isArray(data)
          ? data
          : []
      )


    } catch (error) {

      console.error(
        'Error cargando compras:',
        error
      )


      alert(
        'No se pudieron cargar las compras.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadPurchases()

  }, [])


  // ========================================
  // CAMBIAR FORMULARIO
  // ========================================

  function handleChange(event) {

    const {
      name,
      value,
    } = event.target


    setForm(current => ({

      ...current,

      [name]: value,

    }))

  }


  // ========================================
  // ABRIR FORMULARIO
  // ========================================

  function openForm() {

    setForm({

      name: '',

      category: '',

      quantity: '',

      unitCost: '',

      price: '',

      minimumStock: '0',

      unit: 'pieza',

      notes: '',

    })


    setShowForm(true)

  }


  // ========================================
  // CERRAR FORMULARIO
  // ========================================

  function closeForm() {

    if (saving) {

      return

    }


    setShowForm(false)

  }


  // ========================================
  // GUARDAR COMPRA
  // ========================================

  async function handleSubmit(event) {

    event.preventDefault()


    if (saving) {

      return

    }


    const quantity =
      Number(form.quantity)


    const unitCost =
      Number(form.unitCost)


    // ======================================
    // CALCULAR COSTO TOTAL
    // ======================================

    const totalCost =
      quantity * unitCost


    const price =
      Number(form.price)


    const minimumStock =
      Number(form.minimumStock || 0)


    // ======================================
    // VALIDACIONES
    // ======================================

    if (!form.name.trim()) {

      alert(
        'Escribe el nombre del producto.'
      )

      return

    }


    if (!form.category.trim()) {

      alert(
        'Escribe la categoría del producto.'
      )

      return

    }


    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {

      alert(
        'La cantidad debe ser un número entero mayor a cero.'
      )

      return

    }


    if (
      !Number.isFinite(unitCost) ||
      unitCost < 0
    ) {

      alert(
        'El costo unitario no es válido.'
      )

      return

    }


    if (
      !Number.isFinite(totalCost) ||
      totalCost < 0
    ) {

      alert(
        'El costo total calculado no es válido.'
      )

      return

    }


    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      alert(
        'El precio de venta no es válido.'
      )

      return

    }


    if (
      !Number.isFinite(minimumStock) ||
      minimumStock < 0
    ) {

      alert(
        'El stock mínimo no es válido.'
      )

      return

    }


    try {

      setSaving(true)


      const response =
        await fetch(
          'http://localhost:3001/api/purchases',
          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

            },

            body: JSON.stringify({

              name:
                form.name.trim(),

              category:
                form.category.trim(),

              quantity,

              // El servidor continúa
              // recibiendo el costo total.
              // Ahora lo calculamos aquí.
              totalCost,

              price,

              minimumStock,

              unit:
                form.unit,

              notes:
                form.notes.trim(),

            }),

          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(

          data.error ||
          'No se pudo guardar la compra.'

        )

      }


      // ====================================
      // ACTUALIZAR LISTA
      // ====================================

      setPurchases(current => [

        data.purchase,

        ...current,

      ])


      // ====================================
      // LIMPIAR
      // ====================================

      setForm({

        name: '',

        category: '',

        quantity: '',

        unitCost: '',

        price: '',

        minimumStock: '0',

        unit: 'pieza',

        notes: '',

      })


      setShowForm(false)


      alert(

        `Compra registrada correctamente.\n\n` +

        `Producto: ${data.product.name}\n` +

        `Cantidad: ${quantity}\n` +

        `Costo unitario: ${formatCurrency(unitCost)}\n` +

        `Costo total: ${formatCurrency(totalCost)}\n` +

        `Stock: ${data.product.stock} ${data.product.unit}`

      )


    } catch (error) {

      console.error(
        'Error guardando compra:',
        error
      )


      alert(

        error.message ||
        'No se pudo guardar la compra.'

      )

    } finally {

      setSaving(false)

    }

  }


  // ========================================
  // ELIMINAR COMPRA
  // ========================================

  async function handleDeletePurchase(
    purchaseId
  ) {

    const confirmed =
      window.confirm(

        '¿Estás seguro de eliminar esta compra? Se eliminará también toda la información relacionada.'

      )


    if (!confirmed) {

      return

    }


    try {

      const response =
        await fetch(

          `http://localhost:3001/api/purchases/${purchaseId}`,

          {

            method: 'DELETE',

          }

        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(

          data.error ||
          'No se pudo eliminar la compra.'

        )

      }


      setPurchases(current =>

        current.filter(

          purchase =>
            purchase.id !== purchaseId

        )

      )


      alert(
        'Compra eliminada correctamente.'
      )


    } catch (error) {

      console.error(
        'Error eliminando compra:',
        error
      )


      alert(

        error.message ||
        'No se pudo eliminar la compra.'

      )

    }

  }


  // ========================================
  // FORMATO MONEDA
  // ========================================

  function formatCurrency(value) {

    return new Intl.NumberFormat(

      'es-MX',

      {

        style: 'currency',

        currency: 'MXN',

      }

    ).format(

      Number(value) || 0

    )

  }


  // ========================================
  // CÁLCULOS DE COMPRA
  // ========================================

  const quantity =
    Number(form.quantity || 0)


  const unitCost =
    Number(form.unitCost || 0)


  const totalCost =
    quantity > 0
      ? quantity * unitCost
      : 0


  // ========================================
  // TOTAL COMPRADO
  // ========================================

  const totalPurchases =
    purchases.reduce(

      (total, purchase) =>

        total +
        Number(
          purchase.total_cost || 0
        ),

      0

    )


  return (

    <section className="products-page">


      {/* =====================================
          HEADER
      ====================================== */}

      <div className="products-header">

        <div>

          <p className="welcome">
            Adquisiciones
          </p>

          <h2>
            Compras
          </h2>

          <p className="page-description">

            Registra una compra y Ezra actualizará
            automáticamente productos e inventario.

          </p>

        </div>


        <button

          className="primary-button"

          onClick={openForm}

        >

          + Nueva compra

        </button>

      </div>


      {/* =====================================
          RESUMEN
      ====================================== */}

      <div className="products-summary">

        <div>

          <span>
            Compras registradas
          </span>

          <strong>
            {purchases.length}
          </strong>

        </div>


        <div>

          <span>
            Total comprado
          </span>

          <strong>
            {formatCurrency(
              totalPurchases
            )}
          </strong>

        </div>

      </div>


      {/* =====================================
          TABLA
      ====================================== */}

      <div className="panel">

        <div className="panel-header">

          <div>

            <h3>
              Historial de compras
            </h3>

            <p>
              Todas las adquisiciones registradas.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">

            <div className="empty-icon">
              🌿
            </div>

            <h3>
              Cargando...
            </h3>

          </div>

        ) : purchases.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🧾
            </div>

            <h3>
              No hay compras registradas
            </h3>

            <p>
              Cuando registres una compra aparecerá aquí.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Producto
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Cantidad
                  </th>

                  <th>
                    Costo total
                  </th>

                  <th>
                    Costo c/u
                  </th>

                  <th>
                    Notas
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody>

                {purchases.map(
                  purchase => {

                    const purchaseQuantity =
                      Number(
                        purchase.quantity || 0
                      )


                    const purchaseUnitCost =
                      purchaseQuantity > 0

                        ? Number(
                            purchase.total_cost || 0
                          ) /
                          purchaseQuantity

                        : 0


                    return (

                      <tr
                        key={
                          purchase.id
                        }
                      >

                        <td>

                          #
                          {purchase.id}

                        </td>


                        <td>

                          <strong>

                            {
                              purchase.description
                            }

                          </strong>

                        </td>


                        <td>

                          {new Date(

                            purchase.purchase_date

                          ).toLocaleDateString(

                            'es-MX'

                          )}

                        </td>


                        <td>

                          {purchaseQuantity || '—'}

                        </td>


                        <td>

                          <strong>

                            {formatCurrency(

                              purchase.total_cost

                            )}

                          </strong>

                        </td>


                        <td>

                          {formatCurrency(

                            purchaseUnitCost

                          )}

                        </td>


                        <td>

                          {purchase.notes || '—'}

                        </td>


                        <td>

                          <button

                            className="secondary-button"

                            onClick={() =>
                              handleDeletePurchase(
                                purchase.id
                              )
                            }

                          >

                            Eliminar

                          </button>

                        </td>

                      </tr>

                    )

                  }

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================
          MODAL
      ====================================== */}

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">


            {/* HEADER */}

            <div className="modal-header">

              <div>

                <p className="welcome">
                  Nueva operación
                </p>

                <h3>
                  Registrar compra
                </h3>

              </div>


              <button

                type="button"

                className="modal-close"

                onClick={closeForm}

              >

                ×

              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* =================================
                  PRODUCTO
              ================================== */}

              <div className="form-section">

                <div className="form-section-title">

                  <span>
                    1
                  </span>

                  <div>

                    <strong>
                      Producto
                    </strong>

                    <small>
                      Indica qué producto compraste
                    </small>

                  </div>

                </div>


                <div className="form-group">

                  <label>
                    Nombre del producto
                  </label>

                  <input

                    type="text"

                    name="name"

                    value={
                      form.name
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Ej. Kalanchoe"

                    autoFocus

                  />

                </div>


                <div className="form-group">

                  <label>
                    Categoría
                  </label>

                  <input

                    type="text"

                    name="category"

                    value={
                      form.category
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Ej. Plantas"

                  />

                </div>

              </div>


              {/* =================================
                  COMPRA
              ================================== */}

              <div className="form-section">

                <div className="form-section-title">

                  <span>
                    2
                  </span>

                  <div>

                    <strong>
                      Compra
                    </strong>

                    <small>
                      Cantidad y costo de adquisición
                    </small>

                  </div>

                </div>


                <div className="output-grid">


                  <div className="form-group">

                    <label>
                      Cantidad
                    </label>

                    <input

                      type="number"

                      name="quantity"

                      value={
                        form.quantity
                      }

                      onChange={
                        handleChange
                      }

                      min="1"

                      step="1"

                      placeholder="0"

                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Costo unitario
                    </label>

                    <input

                      type="number"

                      name="unitCost"

                      value={
                        form.unitCost
                      }

                      onChange={
                        handleChange
                      }

                      min="0"

                      step="0.01"

                      placeholder="0.00"

                    />

                  </div>

                </div>


                {quantity > 0 &&
                  form.unitCost !== '' && (

                  <div className="source-cost">

                    <span>
                      Costo total de la compra
                    </span>

                    <strong>

                      {formatCurrency(
                        totalCost
                      )}

                    </strong>

                  </div>

                )}

              </div>


              {/* =================================
                  VENTA E INVENTARIO
              ================================== */}

              <div className="form-section">

                <div className="form-section-title">

                  <span>
                    3
                  </span>

                  <div>

                    <strong>
                      Venta e inventario
                    </strong>

                    <small>
                      Configura cómo se venderá el producto
                    </small>

                  </div>

                </div>


                <div className="output-grid">


                  <div className="form-group">

                    <label>
                      Precio de venta c/u
                    </label>

                    <input

                      type="number"

                      name="price"

                      value={
                        form.price
                      }

                      onChange={
                        handleChange
                      }

                      min="0"

                      step="0.01"

                      placeholder="0.00"

                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Stock mínimo
                    </label>

                    <input

                      type="number"

                      name="minimumStock"

                      value={
                        form.minimumStock
                      }

                      onChange={
                        handleChange
                      }

                      min="0"

                      step="1"

                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Unidad
                    </label>

                    <select

                      name="unit"

                      value={
                        form.unit
                      }

                      onChange={
                        handleChange
                      }

                    >

                      <option value="pieza">
                        Pieza
                      </option>

                      <option value="planta">
                        Planta
                      </option>

                      <option value="maceta">
                        Maceta
                      </option>

                      <option value="bolsa">
                        Bolsa
                      </option>

                      <option value="caja">
                        Caja
                      </option>

                      <option value="kit">
                        Kit
                      </option>

                    </select>

                  </div>

                </div>

              </div>


              {/* =================================
                  NOTAS
              ================================== */}

              <div className="form-section">

                <div className="form-group">

                  <label>
                    Notas
                  </label>

                  <textarea

                    name="notes"

                    value={
                      form.notes
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Información adicional..."

                    rows="3"

                  />

                </div>

              </div>


              {/* =================================
                  PREVISUALIZACIÓN
              ================================== */}

              {quantity > 0 && (

                <div className="transformation-info">

                  <div className="transformation-info-icon">
                    🌱
                  </div>

                  <div>

                    <h3>
                      Entrada automática
                    </h3>

                    <p>

                      Se agregarán{' '}

                      <strong>
                        {quantity}
                      </strong>{' '}

                      {form.unit}{' '}

                      de{' '}

                      <strong>
                        {form.name || 'este producto'}
                      </strong>{' '}

                      al inventario.

                    </p>

                    <p>

                      Costo unitario:{' '}

                      <strong>
                        {formatCurrency(
                          unitCost
                        )}
                      </strong>

                    </p>

                    <p>

                      Costo total:{' '}

                      <strong>
                        {formatCurrency(
                          totalCost
                        )}
                      </strong>

                    </p>

                  </div>

                </div>

              )}


              {/* =================================
                  BOTONES
              ================================== */}

              <div className="form-actions">

                <button

                  type="button"

                  className="secondary-button"

                  onClick={closeForm}

                  disabled={saving}

                >

                  Cancelar

                </button>


                <button

                  type="submit"

                  className="primary-button"

                  disabled={saving}

                >

                  {saving

                    ? 'Guardando...'

                    : 'Guardar compra'

                  }

                </button>

              </div>


            </form>

          </div>

        </div>

      )}

    </section>

  )

}


export default Compras
