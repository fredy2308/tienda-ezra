import API_URL from '../api'
import { useEffect, useState } from 'react'

function Gastos() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    description: '',
    category: 'Operación',
    amount: '',
    paymentMethod: 'Efectivo',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // ========================================
  // CARGAR GASTOS
  // ========================================

  async function loadGastos() {
    try {
      setLoading(true)

      const response = await fetch(
        `${API_URL}/api/expenses`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'No se pudieron cargar los gastos.'
        )
      }

      setGastos(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      console.error(error)

      alert(
        error.message || 'Error cargando gastos.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGastos()
  }, [])

  // ========================================
  // CAMBIAR FORMULARIO
  // ========================================

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  // ========================================
  // REGISTRAR GASTO
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.description.trim()) {
      alert('Escribe una descripción del gasto.')
      return
    }

    const amount = Number(form.amount)

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert('El importe debe ser mayor a cero.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        `${API_URL}/api/expenses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: form.description.trim(),
            category: form.category,
            amount,
            paymentMethod: form.paymentMethod,
            expenseDate: form.expenseDate,
            notes: form.notes.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'No se pudo registrar el gasto.'
        )
      }

      setGastos(previous => [
        data.expense,
        ...previous,
      ])

      setForm({
        description: '',
        category: 'Operación',
        amount: '',
        paymentMethod: 'Efectivo',
        expenseDate: new Date()
          .toISOString()
          .split('T')[0],
        notes: '',
      })
    } catch (error) {
      console.error(error)

      alert(
        error.message ||
        'No se pudo registrar el gasto.'
      )
    } finally {
      setSaving(false)
    }
  }

  // ========================================
  // ELIMINAR GASTO
  // ========================================

  async function deleteGasto(id) {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar este gasto?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/expenses/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'No se pudo eliminar el gasto.'
        )
      }

      setGastos(previous =>
        previous.filter(
          gasto => gasto.id !== id
        )
      )
    } catch (error) {
      console.error(error)

      alert(
        error.message ||
        'No se pudo eliminar el gasto.'
      )
    }
  }

  // ========================================
  // TOTALES
  // ========================================

  const totalGastos = gastos.reduce(
    (total, gasto) =>
      total + Number(gasto.amount || 0),
    0
  )

  const gastosMes = gastos.filter(gasto => {
    const date = new Date(gasto.expense_date)
    const now = new Date()

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  })

  const totalMes = gastosMes.reduce(
    (total, gasto) =>
      total + Number(gasto.amount || 0),
    0
  )

  return (
    <section className="page">

      {/* ================================= */}
      {/* ENCABEZADO */}
      {/* ================================= */}

      <div className="page-header">
        <div>
          <h2>Gastos</h2>

          <p>
            Control y registro de los gastos del negocio.
          </p>
        </div>
      </div>

      {/* ================================= */}
      {/* RESUMEN */}
      {/* ================================= */}

      <div className="stats-grid">

        <div className="stat-card">
          <span>Gastos registrados</span>

          <strong>
            {gastos.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>Gastos del mes</span>

          <strong>
            $
            {totalMes.toLocaleString(
              'es-MX',
              {
                minimumFractionDigits: 2,
              }
            )}
          </strong>
        </div>

        <div className="stat-card">
          <span>Total histórico</span>

          <strong>
            $
            {totalGastos.toLocaleString(
              'es-MX',
              {
                minimumFractionDigits: 2,
              }
            )}
          </strong>
        </div>

      </div>

      {/* ================================= */}
      {/* FORMULARIO */}
      {/* ================================= */}

      <div className="card">

        <div className="card-header">

          <div>
            <h3>Registrar gasto</h3>

            <p>
              Agrega un nuevo gasto del negocio.
            </p>
          </div>

        </div>

        <form
          className="form-grid"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>Descripción</label>

            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ej. Pago de luz"
            />

          </div>

          <div className="form-group">

            <label>Categoría</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="Operación">
                Operación
              </option>

              <option value="Servicios">
                Servicios
              </option>

              <option value="Renta">
                Renta
              </option>

              <option value="Transporte">
                Transporte
              </option>

              <option value="Mantenimiento">
                Mantenimiento
              </option>

              <option value="Publicidad">
                Publicidad
              </option>

              <option value="Nómina">
                Nómina
              </option>

              <option value="Impuestos">
                Impuestos
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>

          </div>

          <div className="form-group">

            <label>Importe</label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />

          </div>

          <div className="form-group">

            <label>Método de pago</label>

            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
            >
              <option value="Efectivo">
                Efectivo
              </option>

              <option value="Tarjeta">
                Tarjeta
              </option>

              <option value="Transferencia">
                Transferencia
              </option>

              <option value="Crédito">
                Crédito
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>

          </div>

          <div className="form-group">

            <label>Fecha</label>

            <input
              type="date"
              name="expenseDate"
              value={form.expenseDate}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <label>Notas</label>

            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Opcional"
            />

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : '💰 Registrar gasto'}
            </button>

          </div>

        </form>

      </div>

      {/* ================================= */}
      {/* LISTADO */}
      {/* ================================= */}

      <div className="card">

        <div className="card-header">

          <div>

            <h3>Historial de gastos</h3>

            <p>
              Registro de todos los gastos realizados.
            </p>

          </div>

        </div>

        {loading ? (

          <div className="empty-state">
            Cargando gastos...
          </div>

        ) : gastos.length === 0 ? (

          <div className="empty-state">

            <div style={{ fontSize: '40px' }}>
              💰
            </div>

            <h3>
              No hay gastos registrados
            </h3>

            <p>
              Registra tu primer gasto utilizando el formulario.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Método</th>
                  <th>Importe</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {gastos.map(gasto => (

                  <tr key={gasto.id}>

                    <td>
                      {gasto.expense_date}
                    </td>

                    <td>

                      <strong>
                        {gasto.description}
                      </strong>

                      {gasto.notes && (
                        <small
                          style={{
                            display: 'block',
                            opacity: 0.65,
                            marginTop: '4px',
                          }}
                        >
                          {gasto.notes}
                        </small>
                      )}

                    </td>

                    <td>
                      {gasto.category}
                    </td>

                    <td>
                      {gasto.payment_method}
                    </td>

                    <td>

                      <strong>
                        $
                        {Number(
                          gasto.amount
                        ).toLocaleString(
                          'es-MX',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </strong>

                    </td>

                    <td>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteGasto(gasto.id)
                        }
                      >
                        🗑️
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  )
}

export default Gastos