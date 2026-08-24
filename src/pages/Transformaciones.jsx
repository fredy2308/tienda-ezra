import API_URL from '../api'
import { useEffect, useState } from 'react'


function Transformaciones() {

  const [purchases, setPurchases] = useState([])

  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)

  const [error, setError] = useState('')


  const [form, setForm] = useState({

    purchaseId: '',

    sourceProductId: '',

    sourceQuantity: 1,

    sourceDescription: '',

    sourceCost: '',

    notes: '',

  })


  const [outputs, setOutputs] = useState([])


  // ========================================
  // CARGAR COMPRAS Y PRODUCTOS
  // ========================================

  async function loadData() {

    try {

      setLoading(true)

      setError('')


      const [
        purchasesResponse,
        productsResponse,
      ] = await Promise.all([

        fetch(
          `${API_URL}/api/purchases`
        ),

        fetch(
          `${API_URL}/api/products`
        ),

      ])


      if (!purchasesResponse.ok) {

        throw new Error(
          'No se pudieron cargar las compras.'
        )

      }


      if (!productsResponse.ok) {

        throw new Error(
          'No se pudieron cargar los productos.'
        )

      }


      const purchasesData =
        await purchasesResponse.json()


      const productsData =
        await productsResponse.json()


      setPurchases(
        Array.isArray(purchasesData)
          ? purchasesData
          : []
      )


      setProducts(
        Array.isArray(productsData)
          ? productsData
          : []
      )


    } catch (error) {

      console.error(
        'Error cargando transformaciones:',
        error
      )


      setError(
        error.message ||
        'No se pudieron cargar los datos.'
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadData()

  }, [])


  // ========================================
  // SELECCIONAR COMPRA
  // ========================================

  function handlePurchaseChange(event) {

    const purchaseId =
      event.target.value


    const purchase =
      purchases.find(
        item =>
          String(item.id) ===
          String(purchaseId)
      )


    if (!purchase) {

      setForm({

        purchaseId: '',

        sourceProductId: '',

        sourceQuantity: 1,

        sourceDescription: '',

        sourceCost: '',

        notes: '',

      })


      setOutputs([])

      return

    }


    setForm(current => ({

      ...current,

      purchaseId,

      sourceProductId: '',

      sourceQuantity: 1,

      sourceDescription:
        purchase.description || '',

      sourceCost: '',

    }))


    setOutputs([])

  }


  // ========================================
  // SELECCIONAR PRODUCTO DE ORIGEN
  // ========================================

  function handleSourceProductChange(event) {

    const sourceProductId =
      event.target.value


    const product =
      products.find(
        item =>
          String(item.id) ===
          String(sourceProductId)
      )


    setForm(current => ({

      ...current,

      sourceProductId,

      sourceDescription:
        product
          ? product.name
          : '',

    }))

  }


  // ========================================
  // CAMBIAR CANTIDAD DE ORIGEN
  // ========================================

  function handleSourceQuantityChange(event) {

    const sourceQuantity =
      Number(event.target.value)


    setForm(current => ({

      ...current,

      sourceQuantity,

    }))

  }


  // ========================================
  // AGREGAR RESULTADO
  // ========================================

  function addOutput() {

    setOutputs(current => [

      ...current,

      {

        productId: '',

        name: '',

        category: '',

        unit: 'pieza',

        quantity: 1,

        salePrice: '',

      },

    ])

  }


  // ========================================
  // ELIMINAR RESULTADO
  // ========================================

  function removeOutput(index) {

    setOutputs(current =>

      current.filter(
        (_, i) =>
          i !== index
      )

    )

  }


  // ========================================
  // CAMBIAR RESULTADO
  // ========================================

  function updateOutput(
    index,
    field,
    value
  ) {

    setOutputs(current =>

      current.map(
        (output, i) => {

          if (i !== index) {

            return output

          }


          return {

            ...output,

            [field]: value,

          }

        }
      )

    )

  }


  // ========================================
  // PRODUCTO DE ORIGEN
  // ========================================

  const sourceProduct =
    products.find(
      product =>
        String(product.id) ===
        String(form.sourceProductId)
    )


  // ========================================
  // COSTO UNITARIO
  // ========================================

  const sourceUnitCost =
    Number(
      sourceProduct?.cost || 0
    )


  // ========================================
  // CANTIDAD ORIGEN
  // ========================================

  const sourceQuantity =
    Number(
      form.sourceQuantity || 0
    )


  // ========================================
  // COSTO TOTAL TRANSFORMADO
  // ========================================

  const sourceCost =
    sourceProduct
      ? sourceUnitCost *
        sourceQuantity
      : 0


  // ========================================
  // VALOR TOTAL DE VENTA
  // ========================================

  const totalProductionValue =
    outputs.reduce(

      (total, output) => {

        const quantity =
          Number(
            output.quantity || 0
          )


        const salePrice =
          Number(
            output.salePrice || 0
          )


        return (
          total +
          quantity *
          salePrice
        )

      },

      0

    )


  // ========================================
  // PORCENTAJE
  // ========================================

  function getPercentage(output) {

    if (
      totalProductionValue <= 0
    ) {

      return 0

    }


    const outputValue =
      Number(output.quantity || 0) *
      Number(output.salePrice || 0)


    return (
      outputValue /
      totalProductionValue *
      100
    )

  }


  // ========================================
  // COSTO CRUDO
  // ========================================

  function calculateRawAllocatedCost(
    output
  ) {

    if (
      totalProductionValue <= 0 ||
      sourceCost <= 0
    ) {

      return 0

    }


    const outputValue =
      Number(output.quantity || 0) *
      Number(output.salePrice || 0)


    return (
      sourceCost *
      (
        outputValue /
        totalProductionValue
      )
    )

  }


  // ========================================
  // COSTOS DISTRIBUIDOS
  // ========================================

  const allocatedCosts =
    outputs.map(
      (output, index) => {

        const rawCost =
          calculateRawAllocatedCost(
            output
          )


        if (
          index <
          outputs.length - 1
        ) {

          return Number(
            rawCost.toFixed(2)
          )

        }


        const previousTotal =
          outputs
            .slice(
              0,
              index
            )
            .reduce(
              (
                total,
                previousOutput,
                previousIndex
              ) => {

                if (
                  previousIndex <
                  outputs.length - 1
                ) {

                  return (
                    total +
                    Number(
                      calculateRawAllocatedCost(
                        previousOutput
                      ).toFixed(2)
                    )
                  )

                }


                return total

              },

              0

            )


        const remaining =
          sourceCost -
          previousTotal


        return Number(
          Math.max(
            0,
            remaining
          ).toFixed(2)
        )

      }
    )


  // ========================================
  // COSTO RESULTADO
  // ========================================

  function calculateAllocatedCost(
    output,
    index
  ) {

    if (
      allocatedCosts[index] !== undefined
    ) {

      return allocatedCosts[index]

    }


    return Number(
      calculateRawAllocatedCost(
        output
      ).toFixed(2)
    )

  }


  // ========================================
  // TOTAL ASIGNADO
  // ========================================

  const totalAllocatedCost =
    allocatedCosts.reduce(

      (total, cost) =>
        total + cost,

      0

    )


  // ========================================
  // DIFERENCIA
  // ========================================

  const difference =
    sourceCost -
    totalAllocatedCost


  const isBalanced =
    Math.abs(difference) < 0.01


  // ========================================
  // MONEDA
  // ========================================

  function money(value) {

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
  // GUARDAR
  // ========================================

  async function handleSubmit(event) {

    event.preventDefault()


    if (!form.purchaseId) {

      alert(
        'Selecciona una compra.'
      )

      return

    }


    if (!form.sourceProductId) {

      alert(
        'Selecciona el producto de origen.'
      )

      return

    }


    if (
      !Number.isInteger(sourceQuantity) ||
      sourceQuantity <= 0
    ) {

      alert(
        'La cantidad a transformar debe ser un número entero mayor a cero.'
      )

      return

    }


    if (!sourceProduct) {

      alert(
        'El producto de origen no existe.'
      )

      return

    }


    if (
      sourceQuantity >
      Number(sourceProduct.stock)
    ) {

      alert(
        `Stock insuficiente. Disponible: ${sourceProduct.stock} ${sourceProduct.unit}.`
      )

      return

    }


    if (
      !Number.isFinite(sourceCost) ||
      sourceCost <= 0
    ) {

      alert(
        'El costo de compra del producto de origen no es válido.'
      )

      return

    }


    if (outputs.length === 0) {

      alert(
        'Agrega al menos un producto resultante.'
      )

      return

    }


    for (
      const output of outputs
    ) {

      if (
        !String(output.name || '').trim()
      ) {

        alert(
          'Escribe el nombre de todos los productos resultantes.'
        )

        return

      }


      if (
        !String(output.category || '').trim()
      ) {

        alert(
          'Escribe la categoría de todos los productos resultantes.'
        )

        return

      }


      if (
        !String(output.unit || '').trim()
      ) {

        alert(
          'Selecciona la unidad de todos los productos resultantes.'
        )

        return

      }


      const quantity =
        Number(output.quantity)


      const salePrice =
        Number(output.salePrice)


      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        alert(
          'La cantidad de cada resultado debe ser un número entero mayor a cero.'
        )

        return

      }


      if (
        !Number.isFinite(salePrice) ||
        salePrice < 0
      ) {

        alert(
          'El precio de venta no puede ser negativo.'
        )

        return

      }

    }


    if (
      totalProductionValue <= 0
    ) {

      alert(
        'El valor total de venta de los resultados debe ser mayor a cero.'
      )

      return

    }


    if (!isBalanced) {

      alert(
        'El costo distribuido no coincide con el costo transformado.'
      )

      return

    }


    try {

      const preparedOutputs =
        outputs.map(
          (
            output,
            index
          ) => ({

            productId:
              output.productId
                ? Number(
                    output.productId
                  )
                : null,

            name:
              String(
                output.name
              ).trim(),

            category:
              String(
                output.category
              ).trim(),

            unit:
              String(
                output.unit
              ).trim(),

            quantity:
              Number(
                output.quantity
              ),

            salePrice:
              Number(
                output.salePrice
              ),

            allocatedCost:
              calculateAllocatedCost(
                output,
                index
              ),

          })
        )


      const response =
        await fetch(
          `${API_URL}/api/transformations`,
          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

            },

            body: JSON.stringify({

              purchaseId:
                form.purchaseId
                  ? Number(
                      form.purchaseId
                    )
                  : null,

              sourceProductId:
                Number(
                  form.sourceProductId
                ),

              sourceQuantity:
                sourceQuantity,

              sourceDescription:
                sourceProduct.name,

              sourceCost:
                sourceCost,

              notes:
                form.notes,

              outputs:
                preparedOutputs,

            }),

          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo registrar la transformación.'
        )

      }


      alert(
        'Transformación registrada correctamente.'
      )


      setShowForm(false)


      setForm({

        purchaseId: '',

        sourceProductId: '',

        sourceQuantity: 1,

        sourceDescription: '',

        sourceCost: '',

        notes: '',

      })


      setOutputs([])


      await loadData()


    } catch (error) {

      console.error(
        'Error registrando transformación:',
        error
      )


      alert(
        error.message ||
        'No se pudo registrar la transformación.'
      )

    }

  }


  // ========================================
  // RENDER
  // ========================================

  return (

    <section className="products-page">


      <div className="products-header">

        <div>

          <p className="welcome">
            Producción e inventario
          </p>

          <h2>
            Transformaciones
          </h2>

          <p className="page-description">
            Convierte tus productos de origen en nuevos productos listos para vender.
          </p>

        </div>


        <button

          className="primary-button"

          onClick={() =>
            setShowForm(true)
          }

        >

          + Nueva transformación

        </button>

      </div>


      {error && (

        <div className="error-message">

          {error}

        </div>

      )}


      <div className="panel transformation-info">

        <div className="transformation-info-icon">
          �YO�
        </div>

        <div>

          <h3>
            Productos resultantes independientes
          </h3>

          <p>
            Cada resultado de una transformación puede ser un producto diferente, con su propio nombre, unidad, costo y precio de venta.
          </p>

        </div>

      </div>


      {loading && (

        <div className="empty-state">

          <div className="empty-icon">
            ⏳
          </div>

          <h3>
            Cargando productos y compras...
          </h3>

        </div>

      )}


      {showForm && (

        <div className="modal-overlay">

          <div className="modal transformation-modal">


            <div className="modal-header">

              <div>

                <p className="welcome">
                  Nueva operación
                </p>

                <h3>
                  Transformar producto
                </h3>

              </div>


              <button

                type="button"

                className="modal-close"

                onClick={() =>
                  setShowForm(false)
                }

              >

                �-

              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* =================================
                  ORIGEN
              ================================= */}

              <div className="form-section">

                <div className="form-section-title">

                  <span>
                    1
                  </span>

                  <div>

                    <strong>
                      Producto de origen
                    </strong>

                    <small>
                      Selecciona el producto que vas a transformar
                    </small>

                  </div>

                </div>


                <div className="form-group">

                  <label>
                    Compra
                  </label>

                  <select

                    value={
                      form.purchaseId
                    }

                    onChange={
                      handlePurchaseChange
                    }

                  >

                    <option value="">
                      Seleccionar compra...
                    </option>


                    {purchases.map(
                      purchase => (

                        <option

                          key={
                            purchase.id
                          }

                          value={
                            purchase.id
                          }

                        >

                          #{purchase.id}
                          {' · '}
                          {purchase.description}
                          {' · '}
                          {money(
                            purchase.total_cost
                          )}
                          {' · '}
                          {purchase.quantity || 1}
                          {' unidades'}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {form.purchaseId && (

                  <>

                    <div className="form-group">

                      <label>
                        Producto de origen
                      </label>

                      <select

                        value={
                          form.sourceProductId
                        }

                        onChange={
                          handleSourceProductChange
                        }

                      >

                        <option value="">
                          Seleccionar producto...
                        </option>


                        {products.map(
                          product => (

                            <option

                              key={
                                product.id
                              }

                              value={
                                product.id
                              }

                            >

                              {product.name}
                              {' · Stock: '}
                              {product.stock}
                              {' '}
                              {product.unit}
                              {' · Costo: '}
                              {money(
                                product.cost
                              )}

                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="form-group">

                      <label>
                        Cantidad a transformar
                      </label>

                      <input

                        type="number"

                        min="1"

                        step="1"

                        max={
                          sourceProduct
                            ? sourceProduct.stock
                            : undefined
                        }

                        value={
                          form.sourceQuantity
                        }

                        onChange={
                          handleSourceQuantityChange
                        }

                      />

                    </div>


                    <div className="source-cost">

                      <span>
                        Costo de compra c/u
                      </span>

                      <strong>
                        {money(
                          sourceUnitCost
                        )}
                      </strong>

                    </div>


                    <div className="source-cost">

                      <span>
                        Costo que se transformará
                      </span>

                      <strong>
                        {money(
                          sourceCost
                        )}
                      </strong>

                    </div>

                  </>

                )}

              </div>


              {/* =================================
                  RESULTADOS
              ================================= */}

              <div className="form-section">

                <div className="form-section-title">

                  <span>
                    2
                  </span>

                  <div>

                    <strong>
                      ¿Qué obtuviste?
                    </strong>

                    <small>
                      Crea cada producto resultante y define su precio de venta
                    </small>

                  </div>

                </div>


                <div className="outputs">


                  {outputs.map(
                    (
                      output,
                      index
                    ) => (

                      <div

                        className="output-card"

                        key={index}

                      >

                        <div className="output-grid">


                          <div className="form-group">

                            <label>
                              Nombre del producto
                            </label>

                            <input

                              type="text"

                              value={
                                output.name
                              }

                              onChange={
                                event =>
                                  updateOutput(
                                    index,
                                    'name',
                                    event.target.value
                                  )
                              }

                              placeholder="Ej. Kalanchoe pequeño"

                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Categoría
                            </label>

                            <input

                              type="text"

                              value={
                                output.category
                              }

                              onChange={
                                event =>
                                  updateOutput(
                                    index,
                                    'category',
                                    event.target.value
                                  )
                              }

                              placeholder="Ej. Plantas"

                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Unidad
                            </label>

                            <select

                              value={
                                output.unit
                              }

                              onChange={
                                event =>
                                  updateOutput(
                                    index,
                                    'unit',
                                    event.target.value
                                  )
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


                          <div className="form-group">

                            <label>
                              Cantidad
                            </label>

                            <input

                              type="number"

                              min="1"

                              step="1"

                              value={
                                output.quantity
                              }

                              onChange={
                                event =>
                                  updateOutput(
                                    index,
                                    'quantity',
                                    event.target.value
                                  )
                              }

                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Precio de venta c/u
                            </label>

                            <input

                              type="number"

                              min="0"

                              step="0.01"

                              value={
                                output.salePrice
                              }

                              onChange={
                                event =>
                                  updateOutput(
                                    index,
                                    'salePrice',
                                    event.target.value
                                  )
                              }

                              placeholder="0.00"

                            />

                          </div>

                        </div>


                        <div className="output-calculation">


                          <div>

                            <span>
                              Valor de venta
                            </span>

                            <strong>

                              {money(

                                Number(
                                  output.quantity || 0
                                ) *
                                Number(
                                  output.salePrice || 0
                                )

                              )}

                            </strong>

                          </div>


                          <div>

                            <span>
                              Participación
                            </span>

                            <strong>

                              {getPercentage(
                                output
                              ).toFixed(2)}
                              %

                            </strong>

                          </div>


                          <div>

                            <span>
                              Costo asignado
                            </span>

                            <strong>

                              {money(
                                calculateAllocatedCost(
                                  output,
                                  index
                                )
                              )}

                            </strong>

                          </div>


                          <div>

                            <span>
                              Costo c/u
                            </span>

                            <strong>

                              {money(

                                Number(
                                  output.quantity || 0
                                ) > 0

                                  ? calculateAllocatedCost(
                                      output,
                                      index
                                    ) /
                                    Number(
                                      output.quantity
                                    )

                                  : 0

                              )}

                            </strong>

                          </div>


                          <div>

                            <span>
                              Utilidad estimada c/u
                            </span>

                            <strong>

                              {money(

                                Number(
                                  output.salePrice || 0
                                ) -

                                (
                                  Number(
                                    output.quantity || 0
                                  ) > 0

                                    ? calculateAllocatedCost(
                                        output,
                                        index
                                      ) /
                                      Number(
                                        output.quantity
                                      )

                                    : 0
                                )

                              )}

                            </strong>

                          </div>


                        </div>


                        <div className="output-footer">

                          <button

                            type="button"

                            className="remove-output"

                            onClick={() =>
                              removeOutput(
                                index
                              )
                            }

                          >

                            Eliminar

                          </button>

                        </div>

                      </div>

                    )
                  )}


                </div>


                <button

                  type="button"

                  className="add-output-button"

                  onClick={
                    addOutput
                  }

                >

                  + Agregar resultado

                </button>

              </div>


              {/* =================================
                  RESUMEN
              ================================= */}

              {form.sourceProductId && (

                <div className="cost-summary">

                  <div>

                    <span>
                      Costo transformado
                    </span>

                    <strong>
                      {money(
                        sourceCost
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Valor total de venta
                    </span>

                    <strong>
                      {money(
                        totalProductionValue
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Costo distribuido
                    </span>

                    <strong>
                      {money(
                        totalAllocatedCost
                      )}
                    </strong>

                  </div>


                  <div
                    className={
                      isBalanced
                        ? 'balanced'
                        : 'not-balanced'
                    }
                  >

                    <span>
                      Diferencia
                    </span>

                    <strong>
                      {money(
                        difference
                      )}
                    </strong>

                  </div>


                  <div className="balance-message">

                    {isBalanced ? (

                      <>
                        �o" El 100% del costo está distribuido
                      </>

                    ) : (

                      <>
                        Revisando distribución...
                      </>

                    )}

                  </div>

                </div>

              )}


              {/* =================================
                  NOTAS
              ================================= */}

              <div className="form-section">

                <div className="form-group">

                  <label>
                    Notas
                  </label>

                  <textarea

                    value={
                      form.notes
                    }

                    onChange={
                      event =>
                        setForm(
                          current => ({

                            ...current,

                            notes:
                              event.target.value,

                          })
                        )
                    }

                    placeholder="Información adicional..."

                    rows="3"

                  />

                </div>

              </div>


              <div className="form-actions">

                <button

                  type="button"

                  className="secondary-button"

                  onClick={() =>
                    setShowForm(false)
                  }

                >

                  Cancelar

                </button>


                <button

                  type="submit"

                  className="primary-button"

                  disabled={

                    !form.purchaseId ||

                    !form.sourceProductId ||

                    outputs.length === 0 ||

                    totalProductionValue <= 0 ||

                    !isBalanced

                  }

                >

                  Registrar transformación

                </button>

              </div>


            </form>

          </div>

        </div>

      )}

    </section>

  )

}


export default Transformaciones
