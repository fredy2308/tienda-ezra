import API_URL from '../api'
import { useEffect, useMemo, useState } from 'react'


function Reportes() {

  // ========================================
  // ESTADOS
  // ========================================

  const [sales, setSales] = useState([])

  const [expenses, setExpenses] = useState([])

  const [purchases, setPurchases] = useState([])

  const [inventory, setInventory] = useState(null)

  const [period, setPeriod] =
    useState('week')

  const [customStart, setCustomStart] =
    useState('')

  const [customEnd, setCustomEnd] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ========================================
  // CARGAR DATOS
  // ========================================

  async function loadReports() {

    try {

      setLoading(true)

      setError('')


      const [
        salesResponse,
        expensesResponse,
        purchasesResponse,
        inventoryResponse,
      ] = await Promise.all([

        fetch(
          `${API_URL}/api/sales`
        ),

        fetch(
          `${API_URL}/api/expenses`
        ),

        fetch(
          `${API_URL}/api/purchases`
        ),

        fetch(
          `${API_URL}/api/inventory/summary`
        ),

      ])


      if (!salesResponse.ok) {

        throw new Error(
          'No se pudieron obtener las ventas.'
        )

      }


      if (!expensesResponse.ok) {

        throw new Error(
          'No se pudieron obtener los gastos.'
        )

      }


      if (!purchasesResponse.ok) {

        throw new Error(
          'No se pudieron obtener las compras.'
        )

      }


      if (!inventoryResponse.ok) {

        throw new Error(
          'No se pudo obtener el inventario.'
        )

      }


      const salesData =
        await salesResponse.json()


      const expensesData =
        await expensesResponse.json()


      const purchasesData =
        await purchasesResponse.json()


      const inventoryData =
        await inventoryResponse.json()


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


      /*
       * Dependiendo de cÃ³mo estÃ© construido
       * tu endpoint de compras, puede regresar:
       *
       * []
       *
       * o:
       *
       * {
       *   purchases: []
       * }
       */

      if (
        Array.isArray(purchasesData)
      ) {

        setPurchases(
          purchasesData
        )

      } else if (
        Array.isArray(
          purchasesData.purchases
        )
      ) {

        setPurchases(
          purchasesData.purchases
        )

      } else {

        setPurchases([])

      }


      setInventory(
        inventoryData
      )

    } catch (err) {

      console.error(
        'Error cargando reportes:',
        err
      )


      setError(
        err.message ||
        'No se pudieron cargar los reportes.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadReports()

  }, [])


  // ========================================
  // FECHAS
  // ========================================

  function parseDate(value) {

    if (!value) {
      return null
    }


    const date =
      new Date(value)


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return null

    }


    return date

  }


  function dateOnly(date) {

    const result =
      new Date(date)


    result.setHours(
      0,
      0,
      0,
      0
    )


    return result

  }


  function formatInputDate(date) {

    const year =
      date.getFullYear()


    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0')


    const day =
      String(
        date.getDate()
      ).padStart(2, '0')


    return `${year}-${month}-${day}`

  }


  // ========================================
  // RANGO DEL PERIODO
  // ========================================

  const periodRange =
    useMemo(() => {

      const now =
        new Date()


      const today =
        dateOnly(now)


      let start =
        new Date(today)


      let end =
        new Date(today)


      if (
        period === 'today'
      ) {

        start =
          new Date(today)

        end =
          new Date(today)

      }


      if (
        period === 'yesterday'
      ) {

        start =
          new Date(today)

        start.setDate(
          start.getDate() - 1
        )

        end =
          new Date(start)

      }


      if (
        period === 'week'
      ) {

        const day =
          today.getDay()


        const mondayOffset =
          day === 0
            ? 6
            : day - 1


        start =
          new Date(today)


        start.setDate(
          start.getDate() -
          mondayOffset
        )


        end =
          new Date(start)


        end.setDate(
          end.getDate() + 6
        )

      }


      if (
        period === 'lastWeek'
      ) {

        const day =
          today.getDay()


        const mondayOffset =
          day === 0
            ? 6
            : day - 1


        start =
          new Date(today)


        start.setDate(
          start.getDate() -
          mondayOffset -
          7
        )


        end =
          new Date(start)


        end.setDate(
          end.getDate() + 6
        )

      }


      if (
        period === 'month'
      ) {

        start =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          )


        end =
          new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          )

      }


      if (
        period === 'lastMonth'
      ) {

        start =
          new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
          )


        end =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            0
          )

      }


      if (
        period === 'custom'
      ) {

        if (
          customStart
        ) {

          const customStartDate =
            new Date(
              `${customStart}T00:00:00`
            )


          if (
            !Number.isNaN(
              customStartDate.getTime()
            )
          ) {

            start =
              customStartDate

          }

        }


        if (
          customEnd
        ) {

          const customEndDate =
            new Date(
              `${customEnd}T00:00:00`
            )


          if (
            !Number.isNaN(
              customEndDate.getTime()
            )
          ) {

            end =
              customEndDate

          }

        }

      }


      start =
        dateOnly(start)


      end =
        dateOnly(end)


      return {
        start,
        end,
      }

    }, [
      period,
      customStart,
      customEnd,
    ])


  // ========================================
  // COMPROBAR SI ESTÃ DENTRO DEL PERIODO
  // ========================================

  function isInPeriod(value) {

    const date =
      parseDate(value)


    if (!date) {
      return false
    }


    const normalized =
      dateOnly(date)


    return (
      normalized >=
        periodRange.start &&
      normalized <=
        periodRange.end
    )

  }


  // ========================================
  // DATOS DEL PERIODO
  // ========================================

  const periodSales =
    useMemo(() => {

      return sales.filter(
        sale =>
          isInPeriod(
            sale.sale_date
          )
      )

    }, [
      sales,
      periodRange,
    ])


  const periodExpenses =
    useMemo(() => {

      return expenses.filter(
        expense =>
          isInPeriod(
            expense.expense_date
          )
      )

    }, [
      expenses,
      periodRange,
    ])


  const periodPurchases =
    useMemo(() => {

      return purchases.filter(
        purchase =>
          isInPeriod(
            purchase.purchase_date ||
            purchase.date ||
            purchase.created_at
          )
      )

    }, [
      purchases,
      periodRange,
    ])


  // ========================================
  // TOTALES
  // ========================================

  const totalSales =
    useMemo(() => {

      return periodSales.reduce(

        (sum, sale) =>

          sum +
          Number(
            sale.total || 0
          ),

        0

      )

    }, [periodSales])


  const productCost =
    useMemo(() => {

      return periodSales.reduce(

        (sum, sale) =>

          sum +
          Number(
            sale.product_cost || 0
          ),

        0

      )

    }, [periodSales])


  const grossProfit =
    Number(
      (
        totalSales -
        productCost
      ).toFixed(2)
    )


  const totalExpenses =
    useMemo(() => {

      return periodExpenses.reduce(

        (sum, expense) =>

          sum +
          Number(
            expense.amount || 0
          ),

        0

      )

    }, [periodExpenses])


  const netProfit =
    Number(
      (
        grossProfit -
        totalExpenses
      ).toFixed(2)
    )


  const totalPurchases =
    useMemo(() => {

      return periodPurchases.reduce(

        (sum, purchase) =>

          sum +
          Number(
            purchase.total_cost ||
            purchase.cost_total ||
            purchase.total ||
            purchase.amount ||
            0
          ),

        0

      )

    }, [periodPurchases])


  // ========================================
  // MARGEN
  // ========================================

  const grossMargin =
    totalSales > 0
      ? Number(
          (
            (
              grossProfit /
              totalSales
            ) * 100
          ).toFixed(1)
        )
      : 0


  // ========================================
  // ROI
  // ========================================

  const roi =
    totalPurchases > 0
      ? Number(
          (
            (
              netProfit /
              totalPurchases
            ) * 100
          ).toFixed(1)
        )
      : 0


  // ========================================
  // TICKET PROMEDIO
  // ========================================

  const averageTicket =
    periodSales.length > 0
      ? Number(
          (
            totalSales /
            periodSales.length
          ).toFixed(2)
        )
      : 0


  // ========================================
  // UTILIDAD PROMEDIO
  // ========================================

  const averageProfit =
    periodSales.length > 0
      ? Number(
          (
            grossProfit /
            periodSales.length
          ).toFixed(2)
        )
      : 0


  // ========================================
  // RECUPERACIÃ“N DE INVERSIÃ“N
  // ========================================

  /*
   * Para no decir que una compra estÃ¡
   * recuperada solamente porque hubo ventas,
   * usamos el costo real de los productos
   * vendidos.
   *
   * Ejemplo:
   *
   * Compras = $805
   * Costo vendido = $407.51
   *
   * RecuperaciÃ³n = 407.51 / 805
   */

  const recoveredAmount =
    Math.min(
      totalPurchases,
      productCost
    )


  const recoveryPercentage =
    totalPurchases > 0
      ? Math.min(
          100,
          Number(
            (
              (
                recoveredAmount /
                totalPurchases
              ) * 100
            ).toFixed(1)
          )
        )
      : 0


  const pendingRecovery =
    Math.max(
      0,
      Number(
        (
          totalPurchases -
          recoveredAmount
        ).toFixed(2)
      )
    )


  // ========================================
  // FLUJO DE DINERO
  // ========================================

  const cashFlow =
    Number(
      (
        totalSales -
        totalPurchases -
        totalExpenses
      ).toFixed(2)
    )


  // ========================================
  // INVENTARIO
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
  // FORMATO MONEDA
  // ========================================

  function money(value) {

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
  // FORMATO FECHA
  // ========================================

  function formatDate(date) {

    return date.toLocaleDateString(
      'es-MX',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )

  }


  // ========================================
  // ETIQUETA DEL PERIODO
  // ========================================

  function periodLabel() {

    if (
      period === 'today'
    ) {

      return 'Hoy'

    }


    if (
      period === 'yesterday'
    ) {

      return 'Ayer'

    }


    if (
      period === 'week'
    ) {

      return 'Esta semana'

    }


    if (
      period === 'lastWeek'
    ) {

      return 'Semana anterior'

    }


    if (
      period === 'month'
    ) {

      return 'Este mes'

    }


    if (
      period === 'lastMonth'
    ) {

      return 'Mes anterior'

    }


    return 'Periodo personalizado'

  }


  // ========================================
  // MENSAJE FINANCIERO
  // ========================================

  function financialMessage() {

    if (
      loading
    ) {

      return 'Analizando la informaciÃ³n financiera...'

    }


    if (
      netProfit > 0
    ) {

      return (
        `El negocio generÃ³ una utilidad neta de ` +
        `${money(netProfit)} durante este periodo. ` +
        `Se registraron ${money(totalSales)} en ventas ` +
        `y ${money(totalExpenses)} en gastos.`
      )

    }


    if (
      netProfit < 0
    ) {

      return (
        `Durante este periodo el negocio tuvo una ` +
        `pÃ©rdida de ${money(
          Math.abs(netProfit)
        )}. ` +
        `Conviene revisar los costos, gastos y margen de venta.`
      )

    }


    return (
      'El resultado del periodo quedÃ³ en equilibrio.'
    )

  }


  // ========================================
  // CARGANDO
  // ========================================

  if (
    loading
  ) {

    return (

      <section className="dashboard">

        <div className="section-title">

          <div>

            <p className="welcome">
              AnÃ¡lisis financiero
            </p>

            <h2>
              Reportes
            </h2>

            <p>
              Analizando la informaciÃ³n de tu negocio...
            </p>

          </div>

        </div>


        <div className="empty-state">

          <div className="empty-icon">
            ðŸ“Š
          </div>

          <h3>
            Cargando reporte...
          </h3>

          <p>
            Consultando ventas, compras, gastos e inventario.
          </p>

        </div>

      </section>

    )

  }


  // ========================================
  // RENDER
  // ========================================

  return (

    <section className="dashboard">

      {/* ================================= */}
      {/* ENCABEZADO */}
      {/* ================================= */}

      <div className="section-title">

        <div>

          <p className="welcome">
            AnÃ¡lisis financiero
          </p>

          <h2>
            Reportes
          </h2>

          <p>
            Analiza cuÃ¡nto invertiste, cuÃ¡nto vendiste,
            cuÃ¡nto gastaste y cuÃ¡nto realmente generÃ³ tu negocio.
          </p>

        </div>

      </div>


      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}

      {error && (

        <div
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#faeeee',
            color: '#b94a48',
            fontSize: '13px',
          }}
        >

          {error}

        </div>

      )}


      {/* ================================= */}
      {/* FILTROS */}
      {/* ================================= */}

      <div className="panel">

        <div className="panel-header">

          <div>

            <h3>
              Periodo del reporte
            </h3>

            <p>
              Selecciona el periodo que deseas analizar.
            </p>

          </div>


          <button
            className="primary-button"
            onClick={loadReports}
          >
            â†» Actualizar
          </button>

        </div>


        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >

          <select
            value={period}
            onChange={event =>
              setPeriod(
                event.target.value
              )
            }
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid #ddd',
              background: '#fff',
              fontSize: '14px',
              minWidth: '190px',
            }}
          >

            <option value="today">
              Hoy
            </option>

            <option value="yesterday">
              Ayer
            </option>

            <option value="week">
              Esta semana
            </option>

            <option value="lastWeek">
              Semana anterior
            </option>

            <option value="month">
              Este mes
            </option>

            <option value="lastMonth">
              Mes anterior
            </option>

            <option value="custom">
              Personalizado
            </option>

          </select>


          {period === 'custom' && (

            <>

              <input
                type="date"
                value={customStart}
                onChange={event =>
                  setCustomStart(
                    event.target.value
                  )
                }
                style={{
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                }}
              />


              <span>
                hasta
              </span>


              <input
                type="date"
                value={customEnd}
                onChange={event =>
                  setCustomEnd(
                    event.target.value
                  )
                }
                style={{
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                }}
              />

            </>

          )}

        </div>


        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: '#f7f8f5',
            color: '#56615a',
            fontSize: '13px',
          }}
        >

          Periodo analizado:{' '}

          <strong>
            {formatDate(
              periodRange.start
            )}

            {' - '}

            {formatDate(
              periodRange.end
            )}
          </strong>

        </div>

      </div>


      {/* ================================= */}
      {/* TARJETAS PRINCIPALES */}
      {/* ================================= */}

      <div className="cards">


        <div className="card">

          <div className="card-icon inventory">
            ðŸ›’
          </div>

          <div>

            <p>
              InversiÃ³n en compras
            </p>

            <h3>
              {money(totalPurchases)}
            </h3>

            <span>
              {periodPurchases.length}{' '}
              {periodPurchases.length === 1
                ? 'compra'
                : 'compras'
              } registradas
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon sales">
            ðŸ’°
          </div>

          <div>

            <p>
              Ventas generadas
            </p>

            <h3>
              {money(totalSales)}
            </h3>

            <span>
              {periodSales.length}{' '}
              {periodSales.length === 1
                ? 'venta'
                : 'ventas'
              } realizadas
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon profit">
            ðŸ“ˆ
          </div>

          <div>

            <p>
              Utilidad bruta
            </p>

            <h3>
              {money(grossProfit)}
            </h3>

            <span>
              Margen {grossMargin}%
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon expenses">
            ðŸ’¸
          </div>

          <div>

            <p>
              Gastos
            </p>

            <h3>
              {money(totalExpenses)}
            </h3>

            <span>
              {periodExpenses.length}{' '}
              {periodExpenses.length === 1
                ? 'gasto'
                : 'gastos'
              }
            </span>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* RESULTADO FINANCIERO */}
      {/* ================================= */}

      <div className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Resultado financiero
              </h3>

              <p>
                AsÃ­ se moviÃ³ el dinero de tu negocio.
              </p>

            </div>

          </div>


          <div className="business-status">


            <div className="status-row">

              <span>
                Ventas
              </span>

              <strong
                style={{
                  color: '#2f7d4a',
                }}
              >
                + {money(totalSales)}
              </strong>

            </div>


            <div className="status-row">

              <span>
                Costo de productos vendidos
              </span>

              <strong>
                - {money(productCost)}
              </strong>

            </div>


            <div className="status-row">

              <span>
                Utilidad bruta
              </span>

              <strong>
                {money(grossProfit)}
              </strong>

            </div>


            <div className="status-row">

              <span>
                Gastos operativos
              </span>

              <strong>
                - {money(totalExpenses)}
              </strong>

            </div>


            <div
              style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e8e3',
              }}
            >

              <div className="status-row">

                <span>

                  <strong>
                    Utilidad neta
                  </strong>

                </span>

                <strong
                  style={{
                    fontSize: '22px',
                    color:
                      netProfit >= 0
                        ? '#2f7d4a'
                        : '#b94a48',
                  }}
                >
                  {money(netProfit)}
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* ================================= */}
        {/* RECUPERACIÃ“N */}
        {/* ================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                RecuperaciÃ³n de inversiÃ³n
              </h3>

              <p>
                Â¿CuÃ¡nto de lo invertido ya recuperaste?
              </p>

            </div>

          </div>


          <div
            style={{
              textAlign: 'center',
              padding: '10px 0 20px',
            }}
          >

            <div
              style={{
                fontSize: '34px',
                fontWeight: '700',
                color:
                  recoveryPercentage >= 100
                    ? '#2f7d4a'
                    : '#66745f',
              }}
            >

              {recoveryPercentage}%

            </div>


            <span
              style={{
                color: '#718071',
                fontSize: '13px',
              }}
            >

              recuperado

            </span>

          </div>


          <div
            style={{
              height: '10px',
              background: '#edf0eb',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '22px',
            }}
          >

            <div
              style={{
                width:
                  `${Math.min(
                    100,
                    recoveryPercentage
                  )}%`,
                height: '100%',
                background:
                  recoveryPercentage >= 100
                    ? '#4f8f63'
                    : '#8aa47c',
                borderRadius: '20px',
                transition: 'width .3s ease',
              }}
            />

          </div>


          <div className="business-status">

            <div className="status-row">

              <span>
                Invertido
              </span>

              <strong>
                {money(totalPurchases)}
              </strong>

            </div>


            <div className="status-row">

              <span>
                Recuperado
              </span>

              <strong>
                {money(recoveredAmount)}
              </strong>

            </div>


            <div className="status-row">

              <span>
                Pendiente
              </span>

              <strong>
                {money(pendingRecovery)}
              </strong>

            </div>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* ANÃLISIS */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              {netProfit >= 0
                ? 'ðŸ“ˆ El negocio generÃ³ utilidad'
                : 'âš ï¸ AtenciÃ³n al resultado del periodo'
              }
            </h3>

            <p>
              AnÃ¡lisis automÃ¡tico del periodo seleccionado.
            </p>

          </div>

        </div>


        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            background:
              netProfit >= 0
                ? '#f1f7f2'
                : '#faeeee',
            color:
              netProfit >= 0
                ? '#41684d'
                : '#8d4d4a',
            lineHeight: '1.7',
            fontSize: '14px',
          }}
        >

          {financialMessage()}

        </div>

      </div>


      {/* ================================= */}
      {/* INDICADORES */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              Indicadores financieros
            </h3>

            <p>
              MÃ©tricas para entender el rendimiento.
            </p>

          </div>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
          }}
        >

          <div className="status-row">

            <span>
              Rendimiento de inversiÃ³n
            </span>

            <strong>
              {roi}%
            </strong>

          </div>


          <div className="status-row">

            <span>
              Margen bruto
            </span>

            <strong>
              {grossMargin}%
            </strong>

          </div>


          <div className="status-row">

            <span>
              Ticket promedio
            </span>

            <strong>
              {money(averageTicket)}
            </strong>

          </div>


          <div className="status-row">

            <span>
              Utilidad promedio
            </span>

            <strong>
              {money(averageProfit)}
            </strong>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* FLUJO DE DINERO */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              Flujo de dinero
            </h3>

            <p>
              Entradas y salidas del periodo.
            </p>

          </div>

        </div>


        <div className="business-status">

          <div className="status-row">

            <span>
              Entradas por ventas
            </span>

            <strong
              style={{
                color: '#2f7d4a',
              }}
            >
              + {money(totalSales)}
            </strong>

          </div>


          <div className="status-row">

            <span>
              Compras
            </span>

            <strong>
              - {money(totalPurchases)}
            </strong>

          </div>


          <div className="status-row">

            <span>
              Gastos
            </span>

            <strong>
              - {money(totalExpenses)}
            </strong>

          </div>


          <div
            style={{
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e8e3',
            }}
          >

            <div className="status-row">

              <span>

                <strong>
                  Resultado del flujo
                </strong>

              </span>

              <strong
                style={{
                  color:
                    cashFlow >= 0
                      ? '#2f7d4a'
                      : '#b94a48',
                  fontSize: '20px',
                }}
              >

                {cashFlow >= 0
                  ? '+ '
                  : '- '
                }

                {money(
                  Math.abs(cashFlow)
                )}

              </strong>

            </div>

          </div>

        </div>

      </div>


      {/* ================================= */}
      {/* COMPRAS */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              Compras e inversiÃ³n
            </h3>

            <p>
              Detalle de cuÃ¡nto destinaste a adquirir mercancÃ­a.
            </p>

          </div>


          <strong>
            {money(totalPurchases)}
          </strong>

        </div>


        {periodPurchases.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ðŸ›’
            </div>

            <h3>
              No hay compras en este periodo
            </h3>

            <p>
              Las compras registradas aparecerÃ¡n aquÃ­.
            </p>

          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Producto
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Fecha
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Cantidad
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Costo unitario
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Total
                  </th>

                </tr>

              </thead>


              <tbody>

                {periodPurchases.map(
                  purchase => (

                    <tr
                      key={
                        purchase.id
                      }
                    >

                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          fontWeight: '600',
                        }}
                      >
                        #{purchase.id}
                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {purchase.product_name ||
                          purchase.name ||
                          purchase.product ||
                          'Producto'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {purchase.purchase_date ||
                          purchase.date ||
                          purchase.created_at ||
                          'â€”'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                        }}
                      >

                        {purchase.quantity || 0}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                        }}
                      >

                        {money(
                          purchase.unit_cost ||
                          purchase.cost ||
                          purchase.cost_per_unit ||
                          0
                        )}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                          fontWeight: '700',
                        }}
                      >

                        {money(
                          purchase.total_cost ||
                          purchase.cost_total ||
                          purchase.total ||
                          purchase.amount ||
                          0
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* VENTAS */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              Ventas del periodo
            </h3>

            <p>
              Detalle de lo que realmente generaste.
            </p>

          </div>


          <strong>
            {money(totalSales)}
          </strong>

        </div>


        {periodSales.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ðŸ’°
            </div>

            <h3>
              No hay ventas en este periodo
            </h3>

          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Venta
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Fecha
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    MÃ©todo
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Venta
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Costo
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Utilidad
                  </th>

                </tr>

              </thead>


              <tbody>

                {periodSales.map(
                  sale => (

                    <tr
                      key={
                        sale.id
                      }
                    >

                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          fontWeight: '700',
                        }}
                      >
                        #{sale.id}
                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {sale.sale_date ||
                          'â€”'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {sale.payment_method ||
                          'Efectivo'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                        }}
                      >

                        {money(
                          sale.total
                        )}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                        }}
                      >

                        {money(
                          sale.product_cost
                        )}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#2f7d4a',
                        }}
                      >

                        {money(
                          sale.gross_profit
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* GASTOS */}
      {/* ================================= */}

      <div
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <h3>
              Gastos del periodo
            </h3>

            <p>
              Dinero destinado a gastos operativos.
            </p>

          </div>


          <strong>
            {money(totalExpenses)}
          </strong>

        </div>


        {periodExpenses.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ðŸ’¸
            </div>

            <h3>
              No hay gastos en este periodo
            </h3>

          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Fecha
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    DescripciÃ³n
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    CategorÃ­a
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    MÃ©todo
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom: '1px solid #e5e8e3',
                    }}
                  >
                    Importe
                  </th>

                </tr>

              </thead>


              <tbody>

                {periodExpenses.map(
                  expense => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {expense.expense_date ||
                          'â€”'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {expense.description}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {expense.category ||
                          'OperaciÃ³n'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                        }}
                      >

                        {expense.payment_method ||
                          'Efectivo'}

                      </td>


                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f0f1ef',
                          textAlign: 'right',
                          fontWeight: '700',
                        }}
                      >

                        {money(
                          expense.amount
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ================================= */}
      {/* RESUMEN FINAL */}
      {/* ================================= */}

      <div
        className="cards"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="card">

          <div className="card-icon inventory">
            ðŸ“¦
          </div>

          <div>

            <p>
              Valor actual del inventario
            </p>

            <h3>
              {money(inventoryValue)}
            </h3>

            <span>
              MercancÃ­a disponible
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon expenses">
            ðŸ›’
          </div>

          <div>

            <p>
              Compras del periodo
            </p>

            <h3>
              {money(totalPurchases)}
            </h3>

            <span>
              Dinero invertido
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon sales">
            ðŸ’°
          </div>

          <div>

            <p>
              Ventas del periodo
            </p>

            <h3>
              {money(totalSales)}
            </h3>

            <span>
              Dinero generado
            </span>

          </div>

        </div>


        <div className="card">

          <div className="card-icon profit">
            ðŸ“ˆ
          </div>

          <div>

            <p>
              Utilidad neta
            </p>

            <h3>
              {money(netProfit)}
            </h3>

            <span>
              DespuÃ©s de gastos
            </span>

          </div>

        </div>

      </div>

    </section>

  )

}


export default Reportes
