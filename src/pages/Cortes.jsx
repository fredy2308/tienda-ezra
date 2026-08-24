import API_URL from '../api'
import { useEffect, useMemo, useState } from 'react'

function Cortes() {

  // ========================================
  // ESTADO
  // ========================================

  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-CA')
  )

  const [summary, setSummary] = useState(null)

  const [cuts, setCuts] = useState([])

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [countedCash, setCountedCash] = useState('')

  const [notes, setNotes] = useState('')


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
  // FORMATO FECHA
  // ========================================

  function formatDate(value) {

    if (!value) {
      return '—'
    }

    const dateObject = new Date(
      `${value}T12:00:00`
    )

    if (Number.isNaN(dateObject.getTime())) {
      return value
    }

    return dateObject.toLocaleDateString(
      'es-MX',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )

  }


  // ========================================
  // CARGAR INFORMACIÓN
  // ========================================

  useEffect(() => {

    loadCutData()

  }, [date])


  async function loadCutData() {

    try {

      setLoading(true)


      // ==================================
      // RESUMEN DEL DÍA
      // ==================================

      const summaryResponse = await fetch(
        `${API_URL}/api/cortes/resumen?date=${date}`
      )


      const summaryData =
        await summaryResponse
          .json()
          .catch(() => ({}))


      if (!summaryResponse.ok) {

        throw new Error(
          summaryData.error ||
          'No se pudo cargar el resumen del corte.'
        )

      }


      // ==================================
      // CORTES REGISTRADOS
      // ==================================

      const cutsResponse = await fetch(
        `${API_URL}/api/cortes`
      )


      const cutsData =
        await cutsResponse
          .json()
          .catch(() => [])


      if (!cutsResponse.ok) {

        throw new Error(
          cutsData.error ||
          'No se pudieron cargar los cortes.'
        )

      }


      setSummary(
        summaryData || {}
      )


      // ==================================
      // FILTRAR POR FECHA
      // ==================================

      if (Array.isArray(cutsData)) {

        const filteredCuts =
          cutsData.filter(
            cut =>
              String(
                cut.cut_date || ''
              ) === String(date)
          )

        setCuts(filteredCuts)

      } else {

        setCuts([])

      }


    } catch (error) {

      console.error(
        'Error cargando cortes:',
        error
      )


      setSummary(null)

      setCuts([])


      alert(
        error.message ||
        'No se pudo cargar la información de cortes.'
      )


    } finally {

      setLoading(false)

    }

  }


  // ========================================
  // DATOS NORMALIZADOS
  // ========================================

  const normalizedSummary = useMemo(() => {

    const data =
      summary || {}


    const sales =
      data.sales || {}


    const expenses =
      data.expenses || {}


    const paymentMethods =
      Array.isArray(
        data.paymentMethods
      )
        ? data.paymentMethods
        : []


    // ==================================
    // VENTAS POR MÉTODO DE PAGO
    // ==================================

    let cashSales = 0

    let cardSales = 0

    let transferSales = 0

    let otherSales = 0


    paymentMethods.forEach(
      method => {

        const name =
          String(
            method?.paymentMethod || ''
          )
            .trim()
            .toLowerCase()


        const total =
          Number(
            method?.total || 0
          )


        if (
          name === 'efectivo'
        ) {

          cashSales += total

        } else if (
          name === 'tarjeta' ||
          name === 'credito' ||
          name === 'crédito' ||
          name === 'debito' ||
          name === 'débito'
        ) {

          cardSales += total

        } else if (
          name === 'transferencia' ||
          name === 'transfer'
        ) {

          transferSales += total

        } else if (name) {

          otherSales += total

        }

      }
    )


    return {

      sales:
        Number(
          sales.total || 0
        ),

      salesCount:
        Number(
          sales.count || 0
        ),

      cashSales:
        Number(
          cashSales.toFixed(2)
        ),

      cardSales:
        Number(
          cardSales.toFixed(2)
        ),

      transferSales:
        Number(
          transferSales.toFixed(2)
        ),

      otherSales:
        Number(
          otherSales.toFixed(2)
        ),

      expenses:
        Number(
          expenses.total || 0
        ),

      expenseCount:
        Number(
          expenses.count || 0
        ),

      cashExpected:
        Number(
          data.cashExpected || 0
        ),

      grossProfit:
        Number(
          data.grossProfit || 0
        ),

      netProfit:
        Number(
          data.netProfit || 0
        ),

    }

  }, [summary])


  // ========================================
  // EFECTIVO ESPERADO
  // ========================================

  const expectedCash =
    normalizedSummary.cashExpected


  // ========================================
  // EFECTIVO CONTADO
  // ========================================

  const counted =
    Math.max(
      0,
      Number(countedCash) || 0
    )


  // ========================================
  // DIFERENCIA
  // ========================================

  const difference =
    Number(
      (
        counted -
        expectedCash
      ).toFixed(2)
    )


  // ========================================
  // TOTAL DE VENTAS
  // ========================================

  const totalSales =
    normalizedSummary.sales


  // ========================================
  // TOTAL DE OPERACIONES
  // ========================================

  const totalOperations =
    normalizedSummary.salesCount


  // ========================================
  // ESTADO DEL CORTE
  // ========================================

  const differenceLabel =
    difference === 0
      ? 'Cuadra'
      : difference > 0
        ? 'Sobrante'
        : 'Faltante'


  const differenceColor =
    difference === 0
      ? 'var(--green-700)'
      : difference > 0
        ? 'var(--warning, #b45309)'
        : 'var(--danger)'


  // ========================================
  // REGISTRAR CORTE
  // ========================================

  async function handleCreateCut() {

    if (!date) {

      alert(
        'Selecciona una fecha.'
      )

      return

    }


    if (countedCash === '') {

      alert(
        'Ingresa el efectivo contado en caja.'
      )

      return

    }


    if (
      !Number.isFinite(
        Number(countedCash)
      ) ||
      Number(countedCash) < 0
    ) {

      alert(
        'El efectivo contado no es válido.'
      )

      return

    }


    // ==================================
    // EVITAR CORTE DUPLICADO
    // ==================================

    if (cuts.length > 0) {

      alert(
        `Ya existe un corte registrado para el día ${formatDate(date)}.`
      )

      return

    }


    try {

      setSaving(true)


      const response =
        await fetch(
          `${API_URL}/api/cortes`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({

                date,

                cashCounted:
                  counted,

                notes:
                  notes.trim(),

              }),

          }
        )


      const data =
        await response
          .json()
          .catch(() => ({}))


      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo registrar el corte.'
        )

      }


      alert(
        'Corte registrado correctamente.'
      )


      setNotes('')

      setCountedCash('')


      await loadCutData()


    } catch (error) {

      console.error(
        'Error registrando corte:',
        error
      )


      alert(
        error.message ||
        'No se pudo registrar el corte.'
      )


    } finally {

      setSaving(false)

    }

  }


  // ========================================
  // RENDER
  // ========================================

  return (

    <section className="products-page">

      {/* ====================================
          HEADER
      ===================================== */}

      <div className="products-header">

        <div>

          <p className="welcome">
            Ezra — Tienda de Plantas y Decoración
          </p>

          <h2>
            Cortes de caja
          </h2>

          <p className="page-description">
            Consulta las ventas del día,
            verifica el efectivo y registra
            el cierre de caja.
          </p>

        </div>

      </div>


      {/* ====================================
          SELECTOR DE FECHA
      ===================================== */}

      <div className="panel">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >

          <div>

            <h3>
              Fecha del corte
            </h3>

            <p
              style={{
                color:
                  'var(--text-secondary)',
                marginTop: '4px',
              }}
            >
              Consulta y cierra la caja de una fecha determinada.
            </p>

          </div>


          <div
            className="form-group"
            style={{
              margin: 0,
              minWidth: '220px',
            }}
          >

            <label>
              Fecha
            </label>

            <input
              type="date"
              value={date}
              onChange={event =>
                setDate(
                  event.target.value
                )
              }
              disabled={
                loading ||
                saving
              }
            />

          </div>

        </div>

      </div>


      {/* ====================================
          LOADING
      ===================================== */}

      {loading ? (

        <div className="panel">

          <div className="empty-state">

            <div className="empty-icon">
              ⏳
            </div>

            <h3>
              Cargando corte...
            </h3>

            <p>
              Estamos consultando las ventas y gastos del día.
            </p>

          </div>

        </div>

      ) : (

        <>

          {/* ==================================
              RESUMEN SUPERIOR
          =================================== */}

          <div className="products-summary">

            <div>

              <span>
                Ventas del día
              </span>

              <strong>
                {formatCurrency(
                  totalSales
                )}
              </strong>

            </div>


            <div>

              <span>
                Operaciones
              </span>

              <strong>
                {totalOperations}
              </strong>

            </div>


            <div>

              <span>
                Gastos
              </span>

              <strong>
                {formatCurrency(
                  normalizedSummary.expenses
                )}
              </strong>

            </div>


            <div>

              <span>
                Efectivo esperado
              </span>

              <strong>
                {formatCurrency(
                  expectedCash
                )}
              </strong>

            </div>

          </div>


          {/* ==================================
              CONTENIDO
          ================================== */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.2fr) minmax(340px, 0.8fr)',
              gap: '20px',
              alignItems: 'start',
            }}
          >

            {/* ================================
                RESUMEN DE MOVIMIENTOS
            ================================= */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Resumen de movimientos
                  </h3>

                  <p>
                    {formatDate(date)}
                  </p>

                </div>

              </div>


              {/* VENTAS */}

              <div
                style={{
                  padding: '16px 0',
                  borderBottom:
                    '1px solid var(--border)',
                }}
              >

                <div
                  className="status-row"
                  style={{
                    marginBottom: '10px',
                  }}
                >

                  <span>
                    Total de ventas
                  </span>

                  <strong>
                    {formatCurrency(
                      normalizedSummary.sales
                    )}
                  </strong>

                </div>


                <div
                  className="status-row"
                  style={{
                    fontSize: '12px',
                    marginBottom: '7px',
                  }}
                >

                  <span>
                    Ventas en efectivo
                  </span>

                  <strong>
                    {formatCurrency(
                      normalizedSummary.cashSales
                    )}
                  </strong>

                </div>


                <div
                  className="status-row"
                  style={{
                    fontSize: '12px',
                    marginBottom: '7px',
                  }}
                >

                  <span>
                    Ventas con tarjeta
                  </span>

                  <strong>
                    {formatCurrency(
                      normalizedSummary.cardSales
                    )}
                  </strong>

                </div>


                <div
                  className="status-row"
                  style={{
                    fontSize: '12px',
                    marginBottom: '7px',
                  }}
                >

                  <span>
                    Transferencias
                  </span>

                  <strong>
                    {formatCurrency(
                      normalizedSummary.transferSales
                    )}
                  </strong>

                </div>


                {normalizedSummary.otherSales > 0 && (

                  <div
                    className="status-row"
                    style={{
                      fontSize: '12px',
                    }}
                  >

                    <span>
                      Otros pagos
                    </span>

                    <strong>
                      {formatCurrency(
                        normalizedSummary.otherSales
                      )}
                    </strong>

                  </div>

                )}

              </div>


              {/* GASTOS */}

              <div
                style={{
                  padding: '16px 0',
                  borderBottom:
                    '1px solid var(--border)',
                }}
              >

                <div
                  className="status-row"
                  style={{
                    marginBottom: '8px',
                  }}
                >

                  <span>
                    Gastos del día
                  </span>

                  <strong
                    style={{
                      color:
                        'var(--danger)',
                    }}
                  >
                    {formatCurrency(
                      normalizedSummary.expenses
                    )}
                  </strong>

                </div>


                <p
                  style={{
                    margin: 0,
                    color:
                      'var(--text-secondary)',
                    fontSize: '12px',
                  }}
                >

                  {normalizedSummary.expenseCount}{' '}

                  {
                    normalizedSummary.expenseCount === 1
                      ? 'gasto registrado'
                      : 'gastos registrados'
                  }

                </p>

              </div>


              {/* EFECTIVO */}

              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background:
                    'var(--green-50)',
                }}
              >

                <div
                  className="status-row"
                  style={{
                    marginBottom: '8px',
                  }}
                >

                  <span>
                    Efectivo esperado
                  </span>

                  <strong
                    style={{
                      color:
                        'var(--green-700)',
                      fontSize: '20px',
                    }}
                  >
                    {formatCurrency(
                      expectedCash
                    )}
                  </strong>

                </div>


                <p
                  style={{
                    margin: 0,
                    color:
                      'var(--text-secondary)',
                    fontSize: '12px',
                  }}
                >
                  El efectivo esperado se calcula
                  con las ventas pagadas en efectivo.
                </p>

              </div>

            </div>


            {/* ================================
                CERRAR CAJA
            ================================= */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <h3>
                    💰 Cerrar caja
                  </h3>

                  <p>
                    Registra el efectivo físico encontrado.
                  </p>

                </div>

              </div>


              {/* EFECTIVO CONTADO */}

              <div className="form-group">

                <label>
                  Efectivo contado
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={countedCash}
                  onChange={event =>
                    setCountedCash(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  disabled={saving}
                />

                <small
                  style={{
                    display: 'block',
                    marginTop: '5px',
                    color:
                      'var(--text-secondary)',
                    fontSize: '11px',
                  }}
                >
                  Cantidad de dinero físico que realmente tienes en caja.
                </small>

              </div>


              {/* RESULTADO */}

              <div
                style={{
                  marginTop: '18px',
                  padding: '16px',
                  borderRadius: '12px',

                  background:
                    difference === 0
                      ? 'var(--green-50)'
                      : 'var(--surface-secondary, #f8faf8)',

                  border:
                    difference === 0
                      ? '1px solid var(--green-200, #bbf7d0)'
                      : '1px solid var(--border)',
                }}
              >

                <div
                  className="status-row"
                  style={{
                    marginBottom: '8px',
                  }}
                >

                  <span>
                    Efectivo esperado
                  </span>

                  <strong>
                    {formatCurrency(
                      expectedCash
                    )}
                  </strong>

                </div>


                <div
                  className="status-row"
                  style={{
                    marginBottom: '8px',
                  }}
                >

                  <span>
                    Efectivo contado
                  </span>

                  <strong>
                    {formatCurrency(
                      counted
                    )}
                  </strong>

                </div>


                <div
                  className="status-row"
                  style={{
                    paddingTop: '10px',
                    borderTop:
                      '1px solid var(--border)',
                  }}
                >

                  <span>
                    {differenceLabel}
                  </span>

                  <strong
                    style={{
                      color:
                        differenceColor,
                      fontSize: '20px',
                    }}
                  >

                    {difference > 0
                      ? '+'
                      : difference < 0
                        ? '-'
                        : ''}

                    {formatCurrency(
                      Math.abs(
                        difference
                      )
                    )}

                  </strong>

                </div>

              </div>


              {/* NOTAS */}

              <div
                className="form-group"
                style={{
                  marginTop: '18px',
                }}
              >

                <label>
                  Notas
                </label>

                <textarea
                  value={notes}
                  onChange={event =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Observaciones del corte..."
                  rows="4"
                  disabled={saving}
                />

              </div>


              {/* BOTÓN */}

              <button
                className="primary-button"
                style={{
                  width: '100%',
                  marginTop: '5px',
                  minHeight: '48px',
                  fontSize: '15px',
                }}

                disabled={
                  saving ||
                  countedCash === '' ||
                  cuts.length > 0
                }

                onClick={
                  handleCreateCut
                }
              >

                {saving
                  ? 'Registrando corte...'
                  : cuts.length > 0
                    ? '✓ Corte ya registrado'
                    : '💰 Registrar corte'}

              </button>

            </div>

          </div>


          {/* ==================================
              HISTORIAL
          =================================== */}

          <div
            className="panel"
            style={{
              marginTop: '20px',
            }}
          >

            <div className="panel-header">

              <div>

                <h3>
                  Historial de cortes
                </h3>

                <p>
                  Cortes registrados para la fecha seleccionada.
                </p>

              </div>

            </div>


            {cuts.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📋
                </div>

                <h3>
                  No hay cortes registrados
                </h3>

                <p>
                  Todavía no se ha registrado un corte para esta fecha.
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
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 8px',
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Fecha
                      </th>

                      <th
                        style={{
                          textAlign: 'right',
                          padding: '12px 8px',
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Ventas
                      </th>

                      <th
                        style={{
                          textAlign: 'right',
                          padding: '12px 8px',
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Esperado
                      </th>

                      <th
                        style={{
                          textAlign: 'right',
                          padding: '12px 8px',
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Contado
                      </th>

                      <th
                        style={{
                          textAlign: 'right',
                          padding: '12px 8px',
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Diferencia
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {cuts.map(
                      (cut, index) => {

                        const cutDifference =
                          Number(
                            cut.difference || 0
                          )


                        const cutExpected =
                          Number(
                            cut.cash_expected || 0
                          )


                        const cutCounted =
                          Number(
                            cut.cash_counted || 0
                          )


                        const cutSales =
                          Number(
                            cut.sales_total || 0
                          )


                        return (

                          <tr
                            key={
                              cut.id ??
                              index
                            }
                          >

                            <td
                              style={{
                                padding: '12px 8px',
                                borderBottom:
                                  '1px solid var(--border)',
                              }}
                            >
                              {formatDate(
                                cut.cut_date
                              )}
                            </td>


                            <td
                              style={{
                                padding: '12px 8px',
                                textAlign: 'right',
                                borderBottom:
                                  '1px solid var(--border)',
                              }}
                            >
                              {formatCurrency(
                                cutSales
                              )}
                            </td>


                            <td
                              style={{
                                padding: '12px 8px',
                                textAlign: 'right',
                                borderBottom:
                                  '1px solid var(--border)',
                              }}
                            >
                              {formatCurrency(
                                cutExpected
                              )}
                            </td>


                            <td
                              style={{
                                padding: '12px 8px',
                                textAlign: 'right',
                                borderBottom:
                                  '1px solid var(--border)',
                              }}
                            >
                              {formatCurrency(
                                cutCounted
                              )}
                            </td>


                            <td
                              style={{
                                padding: '12px 8px',
                                textAlign: 'right',
                                borderBottom:
                                  '1px solid var(--border)',
                                fontWeight: '700',

                                color:
                                  cutDifference === 0
                                    ? 'var(--green-700)'
                                    : cutDifference > 0
                                      ? 'var(--warning, #b45309)'
                                      : 'var(--danger)',
                              }}
                            >

                              {cutDifference > 0
                                ? '+'
                                : cutDifference < 0
                                  ? '-'
                                  : ''}

                              {formatCurrency(
                                Math.abs(
                                  cutDifference
                                )
                              )}

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

        </>

      )}

    </section>

  )

}

export default Cortes