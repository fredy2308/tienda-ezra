import API_URL from '../api'
import { useEffect, useState } from 'react'

function Transformaciones() {
  // ========================================
  // ESTADOS
  // ========================================

  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

      const [purchasesResponse, productsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/purchases`),
          fetch(`${API_URL}/api/products`),
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
  // FORMULARIO VACÍO
  // ========================================

  function getEmptyForm() {
    return {
      purchaseId: '',
      sourceProductId: '',
      sourceQuantity: 1,
      sourceDescription: '',
      sourceCost: '',
      notes: '',
    }
  }

  // ========================================
  // ABRIR FORMULARIO
  // ========================================

  function openForm() {
    setError('')
    setForm(getEmptyForm())
    setOutputs([])
    setShowForm(true)
  }

  // ========================================
  // CERRAR FORMULARIO
  // ========================================

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setForm(getEmptyForm())
    setOutputs([])
  }

  // ========================================
  // SELECCIONAR COMPRA
  // ========================================

  function handlePurchaseChange(event) {
    const purchaseId = event.target.value

    const purchase = purchases.find(
      (item) =>
        String(item.id) === String(purchaseId)
    )

    if (!purchase) {
      setForm(getEmptyForm())
      setOutputs([])
      return
    }

    setForm((current) => ({
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
    const sourceProductId = event.target.value

    const product = products.find(
      (item) =>
        String(item.id) ===
        String(sourceProductId)
    )

    setForm((current) => ({
      ...current,
      sourceProductId,
      sourceDescription: product
        ? product.name
        : '',
    }))
  }

  // ========================================
  // CAMBIAR CANTIDAD DE ORIGEN
  // ========================================

  function handleSourceQuantityChange(event) {
    const value = event.target.value

    setForm((current) => ({
      ...current,
      sourceQuantity:
        value === '' ? '' : Number(value),
    }))
  }

  // ========================================
  // AGREGAR RESULTADO
  // ========================================

  function addOutput() {
    setOutputs((current) => [
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
    setOutputs((current) =>
      current.filter(
        (_, i) => i !== index
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
    setOutputs((current) =>
      current.map((output, i) => {
        if (i !== index) {
          return output
        }

        return {
          ...output,
          [field]: value,
        }
      })
    )
  }

  // ========================================
  // SELECCIONAR PRODUCTO RESULTANTE
  // ========================================

  function handleOutputProductChange(
    index,
    productId
  ) {
    const product = products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    )

    setOutputs((current) =>
      current.map((output, i) => {
        if (i !== index) {
          return output
        }

        if (!product) {
          return {
            ...output,
            productId: '',
            name: '',
            category: '',
            unit: 'pieza',
          }
        }

        return {
          ...output,
          productId: String(product.id),
          name: product.name || '',
          category: product.category || '',
          unit: product.unit || 'pieza',
        }
      })
    )
  }

  // ========================================
  // PRODUCTO DE ORIGEN
  // ========================================

  const sourceProduct =
    products.find(
      (product) =>
        String(product.id) ===
        String(form.sourceProductId)
    )

  // ========================================
  // COSTO UNITARIO
  // ========================================

  const sourceUnitCost =
    Number(sourceProduct?.cost || 0)

  // ========================================
  // CANTIDAD ORIGEN
  // ========================================

  const sourceQuantity =
    Number(form.sourceQuantity || 0)

  // ========================================
  // COSTO TOTAL TRANSFORMADO
  // ========================================

  const sourceCost = sourceProduct
    ? sourceUnitCost * sourceQuantity
    : 0

  // ========================================
  // VALOR TOTAL DE VENTA
  // ========================================

  const totalProductionValue =
    outputs.reduce(
      (total, output) => {
        const quantity =
          Number(output.quantity || 0)

        const salePrice =
          Number(output.salePrice || 0)

        return (
          total +
          quantity * salePrice
        )
      },
      0
    )

  // ========================================
  // PORCENTAJE DE PARTICIPACIÓN
  // ========================================

  function getPercentage(output) {
    if (totalProductionValue <= 0) {
      return 0
    }

    const quantity =
      Number(output.quantity || 0)

    const salePrice =
      Number(output.salePrice || 0)

    const outputValue =
      quantity * salePrice

    return (
      (outputValue /
        totalProductionValue) *
      100
    )
  }

  // ========================================
  // COSTO PROPORCIONAL SIN REDONDEAR
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

    const quantity =
      Number(output.quantity || 0)

    const salePrice =
      Number(output.salePrice || 0)

    const outputValue =
      quantity * salePrice

    return (
      sourceCost *
      (outputValue /
        totalProductionValue)
    )
  }

  // ========================================
  // COSTOS DISTRIBUIDOS
  // ========================================
  //
  // Se redondean los resultados a centavos.
  // El último resultado recibe la diferencia
  // para que la suma sea exactamente igual
  // al costo de origen.
  // ========================================

  const allocatedCosts =
    outputs.map((output, index) => {
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
          .slice(0, index)
          .reduce(
            (
              total,
              previousOutput
            ) => {
              return (
                total +
                Number(
                  calculateRawAllocatedCost(
                    previousOutput
                  ).toFixed(2)
                )
              )
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
    })

  // ========================================
  // COSTO RESULTADO
  // ========================================

  function calculateAllocatedCost(
    output,
    index
  ) {
    if (
      allocatedCosts[index] !==
      undefined
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
        total + Number(cost || 0),
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
  // VALIDAR RESULTADOS
  // ========================================

  function validateOutputs() {
    if (outputs.length === 0) {
      alert(
        'Agrega al menos un producto resultante.'
      )
      return false
    }

    for (
      let index = 0;
      index < outputs.length;
      index++
    ) {
      const output =
        outputs[index]

      if (!output.productId) {
        alert(
          `Selecciona el producto resultante #${
            index + 1
          }.`
        )
        return false
      }

      if (
        !String(
          output.name || ''
        ).trim()
      ) {
        alert(
          `El producto resultante #${
            index + 1
          } no tiene nombre.`
        )
        return false
      }

      if (
        !String(
          output.category || ''
        ).trim()
      ) {
        alert(
          `El producto resultante #${
            index + 1
          } no tiene categoría.`
        )
        return false
      }

      if (
        !String(
          output.unit || ''
        ).trim()
      ) {
        alert(
          `El producto resultante #${
            index + 1
          } no tiene unidad.`
        )
        return false
      }

      const quantity =
        Number(output.quantity)

      const salePrice =
        Number(output.salePrice)

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        alert(
          `La cantidad del producto resultante #${
            index + 1
          } debe ser un número entero mayor a cero.`
        )
        return false
      }

      if (
        !Number.isFinite(
          salePrice
        ) ||
        salePrice < 0
      ) {
        alert(
          `El precio de venta del producto resultante #${
            index + 1
          } no es válido.`
        )
        return false
      }
    }

    return true
  }

  // ========================================
  // GUARDAR TRANSFORMACIÓN
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) {
      return
    }

    // ----------------------------------------
    // COMPRA
    // ----------------------------------------

    if (!form.purchaseId) {
      alert(
        'Selecciona una compra.'
      )
      return
    }

    // ----------------------------------------
    // PRODUCTO DE ORIGEN
    // ----------------------------------------

    if (!form.sourceProductId) {
      alert(
        'Selecciona el producto de origen.'
      )
      return
    }

    if (!sourceProduct) {
      alert(
        'El producto de origen no existe.'
      )
      return
    }

    // ----------------------------------------
    // CANTIDAD
    // ----------------------------------------

    if (
      !Number.isInteger(
        sourceQuantity
      ) ||
      sourceQuantity <= 0
    ) {
      alert(
        'La cantidad a transformar debe ser un número entero mayor a cero.'
      )
      return
    }

    // ----------------------------------------
    // STOCK
    // ----------------------------------------

    const availableStock =
      Number(
        sourceProduct.stock || 0
      )

    if (
      sourceQuantity >
      availableStock
    ) {
      alert(
        `Stock insuficiente. Disponible: ${availableStock} ${sourceProduct.unit || 'unidades'}.`
      )
      return
    }

    // ----------------------------------------
    // COSTO
    // ----------------------------------------

    if (
      !Number.isFinite(
        sourceCost
      ) ||
      sourceCost <= 0
    ) {
      alert(
        'El costo del producto de origen no es válido.'
      )
      return
    }

    // ----------------------------------------
    // RESULTADOS
    // ----------------------------------------

    if (
      !validateOutputs()
    ) {
      return
    }

    // ----------------------------------------
    // VALOR DE PRODUCCIÓN
    // ----------------------------------------

    if (
      totalProductionValue <= 0
    ) {
      alert(
        'El valor total de venta de los resultados debe ser mayor a cero.'
      )
      return
    }

    // ----------------------------------------
    // BALANCE
    // ----------------------------------------

    if (!isBalanced) {
      alert(
        `El costo distribuido no coincide con el costo transformado. Diferencia: ${money(
          difference
        )}`
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      // --------------------------------------
      // PREPARAR RESULTADOS
      // --------------------------------------

      const preparedOutputs =
        outputs.map(
          (
            output,
            index
          ) => ({
            productId:
              Number(
                output.productId
              ),

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
              Number(
                calculateAllocatedCost(
                  output,
                  index
                ).toFixed(2)
              ),
          })
        )

      // --------------------------------------
      // DATOS A ENVIAR
      // --------------------------------------

      const payload = {
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
          Number(
            sourceCost.toFixed(2)
          ),

        notes:
          String(
            form.notes || ''
          ).trim(),

        outputs:
          preparedOutputs,
      }

      console.log(
        'Enviando transformación:',
        payload
      )

      // --------------------------------------
      // PETICIÓN
      // --------------------------------------

      const response =
        await fetch(
          `${API_URL}/api/transformations`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        )

      // --------------------------------------
      // RESPUESTA
      // --------------------------------------

      let data = {}

      try {
        data =
          await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            'No se pudo registrar la transformación.'
        )
      }

      // --------------------------------------
      // ÉXITO
      // --------------------------------------

      alert(
        'Transformación registrada correctamente.'
      )

      setShowForm(false)

      setForm(
        getEmptyForm()
      )

      setOutputs([])

      await loadData()
    } catch (error) {
      console.error(
        'Error registrando transformación:',
        error
      )

      setError(
        error.message ||
          'No se pudo registrar la transformación.'
      )

      alert(
        error.message ||
          'No se pudo registrar la transformación.'
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

      {/* ==================================
          ENCABEZADO
      ================================== */}

      <div className="products-header">

        <div>
          <p className="welcome">
            Producción e inventario
          </p>

          <h2>
            Transformaciones
          </h2>

          <p className="page-description">
            Convierte tus productos de origen
            en nuevos productos listos para
            vender.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openForm}
          disabled={loading}
        >
          + Nueva transformación
        </button>

      </div>

      {/* ==================================
          ERROR
      ================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ==================================
          INFORMACIÓN
      ================================== */}

      <div className="panel transformation-info">

        <div className="transformation-info-icon">
          🔄
        </div>

        <div>
          <h3>
            Transformación de productos
          </h3>

          <p>
            Selecciona un producto de origen,
            indica cuánto vas a transformar y
            distribuye su costo entre los
            productos resultantes.
          </p>
        </div>

      </div>

      {/* ==================================
          CARGANDO
      ================================== */}

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

      {/* ==================================
          SIN DATOS
      ================================== */}

      {!loading &&
        products.length === 0 && (
          <div className="empty-state">

            <div className="empty-icon">
              🌱
            </div>

            <h3>
              No hay productos
            </h3>

            <p>
              Primero registra productos en
              Inventario.
            </p>

          </div>
        )}

      {/* ==================================
          MODAL
      ================================== */}

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm()
            }
          }}
        >

          <div className="modal transformation-modal">

            {/* ==============================
                HEADER MODAL
            ============================== */}

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
                onClick={closeForm}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            {/* ==============================
                FORMULARIO
            ============================== */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* =================================
                  SECCIÓN 1 - ORIGEN
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
                      Selecciona el producto que
                      vas a transformar
                    </small>
                  </div>

                </div>

                {/* COMPRA */}

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
                    disabled={saving}
                  >

                    <option value="">
                      Seleccionar compra...
                    </option>

                    {purchases.map(
                      (purchase) => (
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
                          {
                            purchase.description ||
                            'Compra'
                          }
                          {' · '}
                          {money(
                            purchase.total_cost
                          )}
                          {' · '}
                          {purchase.quantity ||
                            1}
                          {' unidades'}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* PRODUCTO DE ORIGEN */}

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
                        disabled={saving}
                      >

                        <option value="">
                          Seleccionar producto...
                        </option>

                        {products.map(
                          (product) => (
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
                              {
                                product.stock
                              }
                              {' '}
                              {
                                product.unit ||
                                'pieza'
                              }
                              {' · Costo: '}
                              {money(
                                product.cost
                              )}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* CANTIDAD */}

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
                        disabled={
                          !sourceProduct ||
                          saving
                        }
                      />

                    </div>

                    {/* COSTO UNITARIO */}

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

                    {/* COSTO TOTAL */}

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
                  SECCIÓN 2 - RESULTADOS
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
                      Selecciona cada producto
                      resultante y define su
                      cantidad y precio
                    </small>
                  </div>

                </div>

                {/* RESULTADOS */}

                <div className="outputs">

                  {outputs.length === 0 && (
                    <div className="empty-state">

                      <div className="empty-icon">
                        📦
                      </div>

                      <h3>
                        No hay resultados
                      </h3>

                      <p>
                        Agrega los productos
                        obtenidos de la
                        transformación.
                      </p>

                    </div>
                  )}

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

                          {/* PRODUCTO */}

                          <div className="form-group">

                            <label>
                              Producto resultante
                            </label>

                            <select
                              value={
                                output.productId
                              }
                              onChange={(event) =>
                                handleOutputProductChange(
                                  index,
                                  event.target.value
                                )
                              }
                              disabled={saving}
                            >

                              <option value="">
                                Seleccionar producto...
                              </option>

                              {products.map(
                                (product) => (
                                  <option
                                    key={
                                      product.id
                                    }
                                    value={
                                      product.id
                                    }
                                  >
                                    {
                                      product.name
                                    }
                                    {' · '}
                                    {
                                      product.category ||
                                      'Sin categoría'
                                    }
                                    {' · '}
                                    {
                                      product.unit ||
                                      'pieza'
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </div>

                          {/* NOMBRE */}

                          <div className="form-group">

                            <label>
                              Nombre
                            </label>

                            <input
                              type="text"
                              value={
                                output.name
                              }
                              onChange={(event) =>
                                updateOutput(
                                  index,
                                  'name',
                                  event.target.value
                                )
                              }
                              placeholder="Nombre del producto"
                              disabled={
                                !output.productId ||
                                saving
                              }
                            />

                          </div>

                          {/* CATEGORÍA */}

                          <div className="form-group">

                            <label>
                              Categoría
                            </label>

                            <input
                              type="text"
                              value={
                                output.category
                              }
                              onChange={(event) =>
                                updateOutput(
                                  index,
                                  'category',
                                  event.target.value
                                )
                              }
                              placeholder="Ej. Plantas"
                              disabled={
                                !output.productId ||
                                saving
                              }
                            />

                          </div>

                          {/* UNIDAD */}

                          <div className="form-group">

                            <label>
                              Unidad
                            </label>

                            <select
                              value={
                                output.unit
                              }
                              onChange={(event) =>
                                updateOutput(
                                  index,
                                  'unit',
                                  event.target.value
                                )
                              }
                              disabled={
                                !output.productId ||
                                saving
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

                          {/* CANTIDAD */}

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
                              onChange={(event) =>
                                updateOutput(
                                  index,
                                  'quantity',
                                  event.target.value
                                )
                              }
                              disabled={
                                !output.productId ||
                                saving
                              }
                            />

                          </div>

                          {/* PRECIO */}

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
                              onChange={(event) =>
                                updateOutput(
                                  index,
                                  'salePrice',
                                  event.target.value
                                )
                              }
                              placeholder="0.00"
                              disabled={
                                !output.productId ||
                                saving
                              }
                            />

                          </div>

                        </div>

                        {/* =========================
                            CÁLCULOS
                        ========================= */}

                        <div className="output-calculation">

                          <div>
                            <span>
                              Valor de venta
                            </span>

                            <strong>
                              {money(
                                Number(
                                  output.quantity ||
                                    0
                                ) *
                                  Number(
                                    output.salePrice ||
                                      0
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
                                  output.quantity ||
                                    0
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
                                  output.salePrice ||
                                    0
                                ) -
                                  (Number(
                                    output.quantity ||
                                      0
                                  ) > 0
                                    ? calculateAllocatedCost(
                                        output,
                                        index
                                      ) /
                                        Number(
                                          output.quantity
                                        )
                                    : 0)
                              )}
                            </strong>
                          </div>

                        </div>

                        {/* FOOTER */}

                        <div className="output-footer">

                          <button
                            type="button"
                            className="remove-output"
                            onClick={() =>
                              removeOutput(
                                index
                              )
                            }
                            disabled={saving}
                          >
                            Eliminar
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>

                {/* AGREGAR */}

                <button
                  type="button"
                  className="add-output-button"
                  onClick={addOutput}
                  disabled={saving}
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
                        ✅ El 100% del costo está
                        distribuido correctamente.
                      </>
                    ) : (
                      <>
                        ⚠️ Falta distribuir
                        correctamente el costo.
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
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          notes:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Información adicional..."
                    rows="3"
                    disabled={saving}
                  />

                </div>

              </div>

              {/* =================================
                  BOTONES
              ================================= */}

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
                  disabled={
                    saving ||
                    !form.purchaseId ||
                    !form.sourceProductId ||
                    outputs.length === 0 ||
                    totalProductionValue <= 0 ||
                    !isBalanced
                  }
                >
                  {saving
                    ? 'Registrando...'
                    : 'Registrar transformación'}
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