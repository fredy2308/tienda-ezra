import { useEffect, useMemo, useState } from 'react'
import API_URL from '../api'

function Dashboard() {

  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [inventory, setInventory] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  // ========================================
  // CONFIGURACIÃ“N
  // ========================================

  const API_URL = `${API_URL}`


  // ========================================
  // CARGAR INFORMACIÃ“N
  // ========================================

  useEffect(() => {

    async function loadDashboard() {

      try {

        setLoading(true)
        setError('')


        const [
          salesResponse,
          expensesResponse,
          inventoryResponse,
        ] = await Promise.all([

          fetch(`${API_URL}/api/sales`),

          fetch(`${API_URL}/api/expenses`),

          fetch(`${API_URL}/api/inventory/summary`),

        ])


        // ==================================
        // VALIDAR RESPUESTAS
        // ==================================

        if (!salesResponse.ok) {

          throw new Error(
            `Error obteniendo ventas: ${salesResponse.status}`
          )

        }


        if (!expensesResponse.ok) {

          throw new Error(
            `Error obteniendo gastos: ${expensesResponse.status}`
          )

        }


        if (!inventoryResponse.ok) {

          throw new Error(
            `Error obteniendo inventario: ${inventoryResponse.status}`
          )

        }


        // ==================================
        // CONVERTIR JSON
        // ==================================

        const salesData =
          await salesResponse.json()


        const expensesData =
          await expensesResponse.json()


        const inventoryData =
          await inventoryResponse.json()


        // ==================================
        // GUARDAR INFORMACIÃ“N
        // ==================================

        setSales(
          Array.isArray(salesData)
            ? salesData
            : []
        )


        setExpenses(
          Array.isArray(expensesData)
            ? expensesData
            : []
        )


        setInventory(
          inventoryData || {}
        )

      } catch (err) {

        console.error(
          'Error cargando Dashboard:',
          err
        )


        setError(
          err.message ||
          'No se pudo cargar el Dashboard.'
        )

      } finally {

        setLoading(false)

      }

    }


    loadDashboard()

  }, [])


  // ========================================
  // FECHA
  // ========================================

  const isThisWeek = (dateValue) => {

    if (!dateValue) {
      return false
    }


    const date =
      new Date(
        String(dateValue).replace(' ', 'T')
      )


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return false

    }


    const now =
      new Date()


    const currentDay =
      now.getDay()


    const daysFromMonday =
      currentDay === 0
        ? 6
        : currentDay - 1


    const start =
      new Date(now)


    start.setHours(
      0,
      0,
      0,
      0
    )


    start.setDate(
      now.getDate() -
      daysFromMonday
    )


    const end =
      new Date(start)


    end.setDate(
      start.getDate() +
      7
    )


    return (
      date >= start &&
      date < end
    )

  }


  // ========================================
  // VENTAS DE LA SEMANA
  // ========================================

  const weeklySales =
    useMemo(() => {

      return sales.filter(
        sale =>
          isThisWeek(
            sale.sale_date
          )
      )

    }, [sales])


  // ========================================
  // GASTOS DE LA SEMANA
  // ========================================

  const weeklyExpenses =
    useMemo(() => {

      return expenses.filter(
        expense =>
          isThisWeek(
            expense.expense_date
          )
      )

    }, [expenses])


  // ========================================
  // TOTAL DE VENTAS
  // ========================================

  const totalSales =
    useMemo(() => {

      return weeklySales.reduce(

        (sum, sale) => {

          return (
            sum +
            Number(
              sale.total || 0
            )
          )

        },

        0

      )

    }, [weeklySales])


  // ========================================
  // COSTO DE PRODUCTOS
  // ========================================

  const totalCost =
    useMemo(() => {

      return weeklySales.reduce(

        (sum, sale) => {

          return (
            sum +
            Number(
              sale.product_cost || 0
            )
          )

        },

        0

      )

    }, [weeklySales])


  // ========================================
  // UTILIDAD BRUTA
  // ========================================

  const grossProfit =
    useMemo(() => {

      return weeklySales.reduce(

        (sum, sale) => {

          return (
            sum +
            Number(
              sale.gross_profit || 0
            )
          )

        },

        0

      )

    }, [weeklySales])


  // ========================================
  // GASTOS
  // ========================================

  const totalExpenses =
    useMemo(() => {

      return weeklyExpenses.reduce(

        (sum, expense) => {

          return (
            sum +
            Number(
              expense.amount || 0
            )
          )

        },

        0

      )

    }, [weeklyExpenses])


  // ========================================
  // UTILIDAD NETA
  // ========================================

  const netProfit =
    Number(
      (
        grossProfit -
        totalExpenses
      ).toFixed(2)
    )


  // ========================================
  // VALOR DEL INVENTARIO
  // ========================================

  const inventoryValue =
    Number(

      inventory?.inventoryValue ??
      inventory?.totalValue ??
      inventory?.value ??
      inventory?.total_cost ??
      inventory?.totalCost ??
      0

    )


  // ========================================
  // DISTRIBUCIÃ“N DEL DINERO
  // ========================================

  const capitalForRestock =
    Number(
      totalCost.toFixed(2)
    )


  const reinvestment =
    netProfit > 0
      ? Number(
          (
            netProfit *
            0.30
          ).toFixed(2)
        )
      : 0


  const salaryAvailable =
    netProfit > 0
      ? Number(
          (
            netProfit *
            0.40
          ).toFixed(2)
        )
      : 0


  const reserve =
    netProfit > 0
      ? Number(
          (
            netProfit *
            0.30
          ).toFixed(2)
        )
      : 0


  // ========================================
  // FORMATO MONEDA
  // ========================================

  const money = (value) => {

    return Number(
      value || 0
    ).toLocaleString(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
      }
    )

  }


  // ========================================
  // VENTAS RECIENTES
  // ========================================

  const recentSales =
    [...weeklySales]
      .sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      )
      .slice(
        0,
        5
      )


  // ========================================
  // RENDER
  // ========================================

  return (

    <section className="dashboard">


      {/* ================================== */}
      {/* TÃTULO */}
      {/* ================================== */}

      <div className="section-title">

        <div>

          <h2>
            Resumen de la semana
          </h2>

          <p>
            AquÃ­ tienes el estado actual de tu negocio.
          </p>

        </div>

      </div>


      {/* ================================== */}
      {/* ERROR */}
      {/* ================================== */}

      {error && (

        <div
          className="error-message"
          style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >

          âš ï¸ {error}

        </div>

      )}


      {/* ================================== */}
      {/* TARJETAS */}
      {/* ================================== */}

      <div className="cards">


        {/* VENTAS */}

        <div className="card">

          <div className="card-icon sales">
            ðŸ’°
          </div>

          <div>

            <p>
              Ventas
            </p>

            <h3>
              {loading
                ? '...'
                : money(totalSales)
              }
            </h3>

            <span>
              {weeklySales.length}{' '}
              {weeklySales.length === 1
                ? 'venta'
                : 'ventas'
              } esta semana
            </span>

          </div>

        </div>


        {/* UTILIDAD */}

        <div className="card">

          <div className="card-icon profit">
            ðŸ“ˆ
          </div>

          <div>

            <p>
              Utilidad
            </p>

            <h3>
              {loading
                ? '...'
                : money(netProfit)
              }
            </h3>

            <span>
              Utilidad neta esta semana
            </span>

          </div>

        </div>


        {/* INVENTARIO */}

        <div className="card">

          <div className="card-icon inventory">
            ðŸ“¦
          </div>

          <div>

            <p>
              Inventario
            </p>

            <h3>
              {loading
                ? '...'
                : money(inventoryValue)
              }
            </h3>

            <span>
              Valor actual
            </span>

          </div>

        </div>


        {/* GASTOS */}

        <div className="card">

          <div className="card-icon expenses">
            ðŸ’¸
          </div>

          <div>

            <p>
              Gastos
            </p>

            <h3>
              {loading
                ? '...'
                : money(totalExpenses)
              }
            </h3>

            <span>
              Esta semana
            </span>

          </div>

        </div>

      </div>


      {/* ================================== */}
      {/* GRID PRINCIPAL */}
      {/* ================================== */}

      <div className="dashboard-grid">


        {/* ================================= */}
        {/* VENTAS */}
        {/* ================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Ventas de la semana
              </h3>

              <p>
                Resumen de tus ventas recientes
              </p>

            </div>

          </div>


          {loading ? (

            <div className="empty-state">

              <div className="empty-icon">
                â³
              </div>

              <h3>
                Cargando ventas...
              </h3>

            </div>

          ) : recentSales.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ðŸ“Š
              </div>

              <h3>
                AÃºn no hay ventas
              </h3>

              <p>
                Cuando realices ventas aparecerÃ¡n aquÃ­.
              </p>

            </div>

          ) : (

            <div className="sales-list">

              {recentSales.map(
                sale => (

                  <div
                    className="sales-row"
                    key={sale.id}
                  >

                    <div>

                      <strong>
                        Venta #{sale.id}
                      </strong>

                      <span>
                        {sale.payment_method ||
                          'Efectivo'}
                      </span>

                    </div>


                    <div>

                      <strong>
                        {money(
                          sale.total
                        )}
                      </strong>

                      <span>
                        Utilidad:{' '}
                        {money(
                          sale.gross_profit
                        )}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* ================================= */}
        {/* ESTADO DEL NEGOCIO */}
        {/* ================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Estado del negocio
              </h3>

              <p>
                DistribuciÃ³n de tu utilidad
              </p>

            </div>

          </div>


          <div className="business-status">


            {/* REPOSICIÃ“N */}

            <div className="status-row">

              <span>
                Capital para reposiciÃ³n
              </span>

              <strong>
                {money(
                  capitalForRestock
                )}
              </strong>

            </div>


            {/* REINVERSIÃ“N */}

            <div className="status-row">

              <span>
                ReinversiÃ³n
              </span>

              <strong>
                {money(
                  reinvestment
                )}
              </strong>

            </div>


            {/* SALARIO */}

            <div className="status-row">

              <span>
                Salario disponible
              </span>

              <strong>
                {money(
                  salaryAvailable
                )}
              </strong>

            </div>


            {/* RESERVA */}

            <div className="status-row">

              <span>
                Reserva
              </span>

              <strong>
                {money(
                  reserve
                )}
              </strong>

            </div>

          </div>


          {/* ================================= */}
          {/* RESUMEN FINANCIERO */}
          {/* ================================= */}

          <div className="business-summary">


            <div>

              <span>
                Ventas
              </span>

              <strong>
                {money(
                  totalSales
                )}
              </strong>

            </div>


            <div>

              <span>
                Costo de productos
              </span>

              <strong>
                {money(
                  totalCost
                )}
              </strong>

            </div>


            <div>

              <span>
                Utilidad bruta
              </span>

              <strong>
                {money(
                  grossProfit
                )}
              </strong>

            </div>


            <div>

              <span>
                Gastos
              </span>

              <strong>
                {money(
                  totalExpenses
                )}
              </strong>

            </div>


            <div>

              <span>
                Utilidad neta
              </span>

              <strong>
                {money(
                  netProfit
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>

    </section>

  )

}

export default Dashboard
