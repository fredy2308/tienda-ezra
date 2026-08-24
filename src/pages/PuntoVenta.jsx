import { useEffect, useMemo, useState } from 'react'


function PuntoVenta() {

  const [products, setProducts] = useState([])

  const [cart, setCart] = useState([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)

  const [payment, setPayment] = useState('')

  const [shippingCost, setShippingCost] = useState('')

  const [saving, setSaving] = useState(false)


  // ========================================
  // CARGAR PRODUCTOS
  // ========================================

  useEffect(() => {

    loadProducts()

  }, [])


  async function loadProducts() {

    try {

      setLoading(true)


      const response =
        await fetch(
          'http://localhost:3001/api/products'
        )


      if (!response.ok) {

        throw new Error(
          'No se pudieron cargar los productos.'
        )

      }


      const data =
        await response.json()


      setProducts(
        Array.isArray(data)
          ? data
          : []
      )


    } catch (error) {

      console.error(
        'Error cargando productos:',
        error
      )


      alert(
        'No se pudieron cargar los productos.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ========================================
  // DATOS DEL PRODUCTO
  // ========================================

  function getProductName(product) {

    return (
      product.name ||
      product.nombre ||
      'Producto sin nombre'
    )

  }


  function getProductPrice(product) {

    return Number(

      product.sale_price ??
      product.salePrice ??
      product.price ??
      product.precio_venta ??
      0

    )

  }


  function getProductCost(product) {

    return Number(

      product.cost_price ??
      product.costPrice ??
      product.costo ??
      product.cost ??
      0

    )

  }


  function getProductStock(product) {

    return Number(

      product.stock ??
      product.quantity ??
      product.cantidad ??
      0

    )

  }


  function getProductUnit(product) {

    return (
      product.unit ||
      'pieza'
    )

  }


  function getProductCategory(product) {

    return (
      product.category ||
      'Sin categoría'
    )

  }


  // ========================================
  // PRODUCTOS DISPONIBLES PARA VENTA
  // ========================================

  const saleProducts =
    useMemo(() => {

      return products.filter(product => {

        const stock =
          getProductStock(product)

        const price =
          getProductPrice(product)


        /*
          Un producto solamente aparece
          en Punto de Venta si:

          1. Tiene existencia.
          2. Tiene precio de venta mayor a cero.

          Esto evita mostrar productos como
          "kalanchoe" cuando fue consumido
          completamente por una transformación.
        */

        return (
          stock > 0 &&
          price > 0
        )

      })

    }, [products])


  // ========================================
  // BUSCADOR
  // ========================================

  const filteredProducts =
    useMemo(() => {

      const text =
        search
          .trim()
          .toLowerCase()


      if (!text) {

        return saleProducts

      }


      return saleProducts.filter(
        product => {

          const name =
            String(
              product.name ||
              product.nombre ||
              ''
            ).toLowerCase()


          const category =
            String(
              product.category ||
              ''
            ).toLowerCase()


          const sku =
            String(
              product.sku ||
              ''
            ).toLowerCase()


          return (

            name.includes(text) ||
            category.includes(text) ||
            sku.includes(text)

          )

        }
      )

    }, [
      saleProducts,
      search
    ])


  // ========================================
  // AGREGAR AL CARRITO
  // ========================================

  function addToCart(product) {

    const stock =
      getProductStock(product)


    const price =
      getProductPrice(product)


    if (stock <= 0) {

      alert(
        'Este producto no tiene existencias.'
      )

      return

    }


    if (price <= 0) {

      alert(
        'Este producto no tiene un precio de venta válido.'
      )

      return

    }


    setCart(current => {

      const existing =
        current.find(
          item =>
            item.id === product.id
        )


      // ==================================
      // EL PRODUCTO YA ESTÁ EN EL CARRITO
      // ==================================

      if (existing) {

        if (
          existing.quantity >=
          stock
        ) {

          alert(
            'No hay más unidades disponibles en el inventario.'
          )

          return current

        }


        return current.map(
          item => {

            if (
              item.id !== product.id
            ) {

              return item

            }


            return {

              ...item,

              quantity:
                item.quantity + 1,

            }

          }
        )

      }


      // ==================================
      // PRODUCTO NUEVO EN EL CARRITO
      // ==================================

      const promotions =
        Array.isArray(
          product.promotions
        )
          ? product.promotions
              .filter(
                promotion =>
                  promotion &&
                  Number(
                    promotion.quantity
                  ) > 0 &&
                  Number(
                    promotion.price
                  ) >= 0
              )
              .map(
                promotion => ({

                  ...promotion,

                  quantity:
                    Number(
                      promotion.quantity
                    ),

                  price:
                    Number(
                      promotion.price
                    ),

                })
              )
          : []


      return [

        ...current,

        {

          ...product,

          quantity: 1,

          // ==================================
          // PROMOCIONES DISPONIBLES
          // ==================================

          promotions,


          // ==================================
          // PROMOCIÓN SELECCIONADA
          // ==================================

          /*
            null significa que actualmente
            se está utilizando el precio normal.

            La promoción NO se aplica
            automáticamente.
          */

          selectedPromotion:
            null,

        },

      ]

    })

  }
   // ========================================
  // AUMENTAR CANTIDAD
  // ========================================

  function increaseQuantity(id) {

    setCart(current =>

      current.map(item => {

        if (
          item.id !== id
        ) {

          return item

        }


        const stock =
          getProductStock(item)


        // ==================================
        // VALIDAR STOCK
        // ==================================

        if (
          item.quantity >= stock
        ) {

          alert(
            'No hay más unidades disponibles en el inventario.'
          )

          return item

        }


        const newQuantity =
          item.quantity + 1


        // ==================================
        // CONSERVAR PROMOCIÓN SELECCIONADA
        // ==================================

        /*
          La cantidad puede aumentar sin
          cambiar automáticamente la promoción.

          Esto permite que tú decidas cuándo
          aplicar o quitar una promoción.
        */

        return {

          ...item,

          quantity:
            newQuantity,

          selectedPromotion:
            item.selectedPromotion || null,

        }

      })

    )

  }

    // ========================================
  // DISMINUIR CANTIDAD
  // ========================================

  function decreaseQuantity(id) {

    setCart(current =>

      current

        .map(item => {

          // ==================================
          // PRODUCTO DIFERENTE
          // ==================================

          if (
            item.id !== id
          ) {

            return item

          }


          const newQuantity =
            item.quantity - 1


          // ==================================
          // SI LLEGA A CERO
          // ==================================

          if (
            newQuantity <= 0
          ) {

            return {

              ...item,

              quantity:
                0,

              selectedPromotion:
                null,

            }

          }


          // ==================================
          // VALIDAR PROMOCIÓN SELECCIONADA
          // ==================================

          let selectedPromotion =
            item.selectedPromotion || null


          if (
            selectedPromotion
          ) {

            const promotionQuantity =
              Number(
                selectedPromotion.quantity
              )


            /*
              Si la nueva cantidad ya no alcanza
              para la promoción seleccionada,
              la quitamos.

              Ejemplo:

              Promoción:
              2 plantas por $60

              Cantidad:
              2 → válida

              Cantidad:
              1 → se elimina la promoción.
            */

            if (
              !Number.isInteger(
                promotionQuantity
              ) ||
              promotionQuantity >
                newQuantity
            ) {

              selectedPromotion =
                null

            }

          }


          return {

            ...item,

            quantity:
              newQuantity,

            selectedPromotion,

          }

        })


        // ==================================
        // ELIMINAR PRODUCTOS CON CANTIDAD 0
        // ==================================

        .filter(
          item =>
            item.quantity > 0
        )

    )

  }

    // ========================================
  // ELIMINAR DEL CARRITO
  // ========================================

  function removeFromCart(id) {

    setCart(current => {

      return current.filter(
        item =>
          item.id !== id
      )

    })

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
  // PROMOCIONES
  // ========================================

  /*
    Cada promoción tiene:

    quantity = cantidad de piezas
    price    = precio total por esas piezas

    Ejemplo:

    2 piezas por $60
    3 piezas por $90

    El sistema NO está limitado a esos números.
    Puedes agregar cualquier cantidad y cualquier precio.
  */

     // ========================================
  // CALCULAR PRECIO CON PROMOCIÓN
  // ========================================

  /*
    Calcula el precio de una cantidad de
    productos utilizando UNA promoción
    específica.

    Ejemplo:

    Precio normal: $35

    Promoción seleccionada:
    2 piezas por $60

    Cantidad: 5

    Resultado:

    2 piezas = $60
    2 piezas = $60
    1 pieza  = $35

    Total = $155
  */

  function calculatePromotionPrice(
    quantity,
    normalPrice,
    promotion
  ) {

    const cleanQuantity =
      Number(quantity) || 0


    const cleanNormalPrice =
      Number(normalPrice) || 0


    // ==================================
    // VALIDAR CANTIDAD
    // ==================================

    if (
      !Number.isInteger(
        cleanQuantity
      ) ||
      cleanQuantity <= 0
    ) {

      return 0

    }


    // ==================================
    // VALIDAR PRECIO NORMAL
    // ==================================

    if (
      !Number.isFinite(
        cleanNormalPrice
      ) ||
      cleanNormalPrice < 0
    ) {

      return 0

    }


    // ==================================
    // SI NO HAY PROMOCIÓN
    // ==================================

    if (
      !promotion
    ) {

      return Number(
        (
          cleanQuantity *
          cleanNormalPrice
        ).toFixed(2)
      )

    }


    // ==================================
    // DATOS DE LA PROMOCIÓN
    // ==================================

    const promotionQuantity =
      Number(
        promotion.quantity
      )


    const promotionPrice =
      Number(
        promotion.price
      )


    // ==================================
    // VALIDAR PROMOCIÓN
    // ==================================

    if (
      !Number.isInteger(
        promotionQuantity
      ) ||
      promotionQuantity <= 0
    ) {

      return Number(
        (
          cleanQuantity *
          cleanNormalPrice
        ).toFixed(2)
      )

    }


    if (
      !Number.isFinite(
        promotionPrice
      ) ||
      promotionPrice < 0
    ) {

      return Number(
        (
          cleanQuantity *
          cleanNormalPrice
        ).toFixed(2)
      )

    }


    // ==================================
    // CANTIDAD DE PAQUETES
    // ==================================

    const packages =
      Math.floor(
        cleanQuantity /
        promotionQuantity
      )


    // ==================================
    // PIEZAS RESTANTES
    // ==================================

    const remaining =
      cleanQuantity %
      promotionQuantity


    // ==================================
    // PRECIO DE LOS PAQUETES
    // ==================================

    const promotionTotal =
      packages *
      promotionPrice


    // ==================================
    // PRECIO DE LAS PIEZAS RESTANTES
    // ==================================

    const remainingTotal =
      remaining *
      cleanNormalPrice


    // ==================================
    // PRECIO FINAL
    // ==================================

    return Number(
      (
        promotionTotal +
        remainingTotal
      ).toFixed(2)
    )

  }
   // ========================================
  // PRECIO TOTAL DEL PRODUCTO
  // ========================================

  function getItemSaleTotal(item) {

    const price =
      getProductPrice(item)


    // ==================================
    // SIN PROMOCIÓN
    // ==================================

    if (
      !item.selectedPromotion
    ) {

      return Number(
        (
          price *
          item.quantity
        ).toFixed(2)
      )

    }


    // ==================================
    // CON PROMOCIÓN
    // ==================================

    return calculatePromotionPrice(

      item.quantity,

      price,

      item.selectedPromotion

    )

  }


  /*
    Precio efectivo por pieza después
    de aplicar la promoción.

    Se utiliza para mostrarlo en pantalla.
  */

  function getItemEffectiveUnitPrice(item) {

    if (
      !item.quantity
    ) {

      return 0

    }


    return Number(

      (
        getItemSaleTotal(item) /
        item.quantity
      ).toFixed(2)

    )

  }


  /*
    Subtotal de toda la venta.

    IMPORTANTE:

    Aquí ya no utilizamos simplemente:

      precio × cantidad

    porque ahora puede existir
    una promoción.
  */

  const subtotal =
    cart.reduce(

      (sum, item) =>

        sum +
        getItemSaleTotal(item),

      0

    )


  const shipping =
    Math.max(
      0,
      Number(shippingCost) || 0
    )


  const total =
    Number(
      (
        subtotal +
        shipping
      ).toFixed(2)
    )


  const totalItems =
    cart.reduce(

      (sum, item) =>

        sum +
        item.quantity,

      0

    )


  const paymentAmount =
    Math.max(
      0,
      Number(payment) || 0
    )


  const change =
    Number(
      (
        paymentAmount -
        total
      ).toFixed(2)
    )


  // ========================================
  // DESCUENTO TOTAL
  // ========================================

  /*
    Calculamos cuánto se está ahorrando
    el cliente gracias a las promociones.

    Precio normal:
      precio × cantidad

    Precio promocional:
      getItemSaleTotal(item)
  */

  const totalDiscount =
    cart.reduce(

      (sum, item) => {

        const normalTotal =
          getProductPrice(item) *
          item.quantity


        const saleTotal =
          getItemSaleTotal(item)


        const discount =
          normalTotal -
          saleTotal


        return (

          sum +
          Math.max(
            0,
            discount
          )

        )

      },

      0

    )


  // ========================================
  // UTILIDAD ESTIMADA
  // ========================================

  /*
    La utilidad ahora toma en cuenta
    el precio real cobrado después
    de aplicar promociones.
  */

  const estimatedProfit =
    cart.reduce(

      (sum, item) => {

        const saleTotal =
          getItemSaleTotal(item)


        const cost =
          getProductCost(item)


        const totalCost =
          cost *
          item.quantity


        return (

          sum +
          (
            saleTotal -
            totalCost
          )

        )

      },

      0

    )

  // ========================================
  // REGISTRAR VENTA
  // ========================================

  async function handleSale() {

    if (
      cart.length === 0
    ) {

      alert(
        'Agrega al menos un producto al carrito.'
      )

      return

    }


    if (
      paymentAmount < total
    ) {

      alert(
        'El pago recibido es insuficiente.'
      )

      return

    }


    try {

      setSaving(true)


      const response =
        await fetch(

          'http://localhost:3001/api/sales',

          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

            },

            body: JSON.stringify({

              items:

  cart.map(item => ({

    productId:
      item.id,

    quantity:
      item.quantity,

    unitPrice:
      getItemEffectiveUnitPrice(item),

    unitCost:
      getProductCost(item),

  })),
              subtotal,

              shippingCost:
                shipping,

              total,

              payment:
                paymentAmount,

              change,

            }),

          }

        )


      const data =
        await response.json()
          .catch(
            () => ({})
          )


      if (!response.ok) {

        throw new Error(

          data.error ||
          'No se pudo registrar la venta.'

        )

      }


      alert(

        'Venta registrada correctamente.'

      )


      setCart([])

      setPayment('')

      setShippingCost('')


      await loadProducts()


    } catch (error) {

      console.error(
        'Error registrando venta:',
        error
      )


      alert(

        error.message ||
        'No se pudo registrar la venta.'

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


      {/* =====================================
          HEADER
      ====================================== */}

      <div className="products-header">

        <div>

          <p className="welcome">
            Ezra — Tienda de Plantas y Decoración
          </p>

          <h2>
            Punto de venta
          </h2>

          <p className="page-description">

            Realiza ventas, controla existencias
            y registra tus cobros desde un solo lugar.

          </p>

        </div>

      </div>


      {/* =====================================
          RESUMEN SUPERIOR
      ====================================== */}

      <div className="products-summary">

        <div>

          <span>
            Productos disponibles
          </span>

          <strong>
            {saleProducts.length}
          </strong>

        </div>


        <div>

          <span>
            Productos en carrito
          </span>

          <strong>
            {totalItems}
          </strong>

        </div>


        <div>

          <span>
            Total actual
          </span>

          <strong>

            {formatCurrency(total)}

          </strong>

        </div>

      </div>


      {/* =====================================
          CONTENIDO PRINCIPAL
      ====================================== */}

      <div

        style={{

          display: 'grid',

          gridTemplateColumns:
            'minmax(0, 1.55fr) minmax(340px, 0.75fr)',

          gap: '20px',

          alignItems: 'start',

        }}

      >


        {/* ===================================
            CATÁLOGO
        ==================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Catálogo
              </h3>

              <p>

                Solo se muestran productos
                disponibles para venta.

              </p>

            </div>

          </div>


          {/* BUSCADOR */}

          <div
            className="form-group"
            style={{
              marginBottom: '20px'
            }}
          >

            <label>
              Buscar producto
            </label>

            <input

              type="text"

              value={search}

              onChange={event =>
                setSearch(
                  event.target.value
                )
              }

              placeholder="Buscar por nombre, categoría o SKU..."

            />

          </div>


          {/* CARGANDO */}

          {loading ? (

            <div className="empty-state">

              <div className="empty-icon">
                🌱
              </div>

              <h3>
                Cargando inventario...
              </h3>

              <p>
                Estamos consultando los productos disponibles.
              </p>

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🌿
              </div>

              <h3>

                {search.trim()
                  ? 'No encontramos productos'
                  : 'No hay productos disponibles'}

              </h3>

              <p>

                {search.trim()

                  ? 'Prueba con otro nombre o categoría.'

                  : 'Los productos con stock en cero o precio de venta en $0 no aparecen aquí.'}

              </p>

            </div>

          ) : (

            <div

              style={{

                display: 'grid',

                gridTemplateColumns:
                  'repeat(auto-fill, minmax(190px, 1fr))',

                gap: '16px',

              }}

            >

              {filteredProducts.map(
                product => {

                  const price =
                    getProductPrice(product)


                  const stock =
                    getProductStock(product)


                  const unit =
                    getProductUnit(product)


                  const category =
                    getProductCategory(product)


                  const lowStock =
                    stock <= 2


                  return (

                    <div

                      key={
                        product.id
                      }

                      style={{

                        border:
                          '1px solid var(--border)',

                        borderRadius:
                          '14px',

                        padding:
                          '16px',

                        background:
                          'var(--surface, #fff)',

                        transition:
                          'all 0.2s ease',

                      }}

                    >

                      {/* ICONO */}

                      <div

                        style={{

                          width:
                            '48px',

                          height:
                            '48px',

                          borderRadius:
                            '12px',

                          background:
                            'var(--green-50)',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'center',

                          fontSize:
                            '25px',

                          marginBottom:
                            '12px',

                        }}

                      >

                        🌱

                      </div>


                      {/* CATEGORÍA */}

                      <div

                        style={{

                          fontSize:
                            '11px',

                          color:
                            'var(--text-secondary)',

                          textTransform:
                            'uppercase',

                          letterSpacing:
                            '0.05em',

                          marginBottom:
                            '5px',

                        }}

                      >

                        {category}

                      </div>


                      {/* NOMBRE */}

                      <strong

                        style={{

                          display:
                            'block',

                          fontSize:
                            '15px',

                          lineHeight:
                            '1.3',

                          minHeight:
                            '39px',

                        }}

                      >

                        {
                          getProductName(
                            product
                          )
                        }

                      </strong>


                      {/* PRECIO */}

                      <div

                        style={{

                          color:
                            'var(--green-700)',

                          fontWeight:
                            '800',

                          fontSize:
                            '19px',

                          marginTop:
                            '10px',

                        }}

                      >

                        {formatCurrency(
                          price
                        )}

                      </div>


                      {/* STOCK */}

                      <div

                        style={{

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'space-between',

                          gap:
                            '8px',

                          marginTop:
                            '8px',

                          marginBottom:
                            '14px',

                          fontSize:
                            '11px',

                        }}

                      >

                        <span

                          style={{

                            color:
                              lowStock

                                ? 'var(--danger)'

                                : 'var(--text-secondary)',

                            fontWeight:
                              lowStock
                                ? '700'
                                : '500',

                          }}

                        >

                          {lowStock
                            ? '⚠ Poco stock'
                            : '✓ Disponible'}

                        </span>


                        <span>

                          {stock} {unit}

                        </span>

                      </div>


                      {/* BOTÓN */}

                      <button

                        className="primary-button"

                        style={{
                          width: '100%'
                        }}

                        onClick={() =>
                          addToCart(
                            product
                          )
                        }

                      >

                        + Agregar

                      </button>

                    </div>

                  )

                }

              )}

            </div>

          )}

        </div>


        {/* ===================================
            CARRITO
        ==================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                🛒 Venta actual
              </h3>

              <p>

                {totalItems === 0

                  ? 'No hay productos seleccionados.'

                  : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} seleccionados.`

                }

              </p>

            </div>


            {cart.length > 0 && (

              <button

                className="delete-button"

                onClick={() =>
                  setCart([])
                }

                disabled={saving}

              >

                Vaciar

              </button>

            )}

          </div>


          {/* CARRITO VACÍO */}

          {cart.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🛒
              </div>

              <h3>
                Carrito vacío
              </h3>

              <p>

                Selecciona productos del catálogo
                para comenzar una venta.

              </p>

            </div>

          ) : (

            <>

                           {/* =================================
                  PRODUCTOS DEL CARRITO
              ================================== */}

              <div>

                {cart.map(item => {

                  const price =
                    getProductPrice(
                      item
                    )


                  const stock =
                    getProductStock(
                      item
                    )


                  const normalTotal =
                    Number(
                      (
                        price *
                        item.quantity
                      ).toFixed(2)
                    )


                  const saleTotal =
                    getItemSaleTotal(
                      item
                    )


                  const effectiveUnitPrice =
                    getItemEffectiveUnitPrice(
                      item
                    )


                  const itemDiscount =
                    Math.max(

                      0,

                      normalTotal -
                      saleTotal

                    )


                  const hasPromotions =
                    Array.isArray(
                      item.promotions
                    ) &&
                    item.promotions.length > 0


                  return (

                    <div

                      key={
                        item.id
                      }

                      style={{

                        padding:
                          '14px 0',

                        borderBottom:
                          '1px solid var(--border)',

                      }}

                    >

                      {/* =================================
                          NOMBRE Y TOTAL
                      ================================== */}

                      <div

                        style={{

                          display:
                            'flex',

                          justifyContent:
                            'space-between',

                          gap:
                            '10px',

                        }}

                      >

                        <div>

                          <strong>

                            {
                              getProductName(
                                item
                              )
                            }

                          </strong>


                          <p

                            style={{

                              color:
                                'var(--text-secondary)',

                              fontSize:
                                '11px',

                              marginTop:
                                '3px',

                            }}

                          >

                            {formatCurrency(
                              price
                            )}{' '}
                            c/u

                          </p>

                        </div>


                        <strong

                          style={{

                            color:
                              'var(--green-700)',

                            fontSize:
                              '16px',

                          }}

                        >

                          {formatCurrency(
                            saleTotal
                          )}

                        </strong>

                      </div>


                      {/* =================================
                          CONTROLES DE CANTIDAD
                      ================================== */}

                      <div

                        style={{

                          display:
                            'flex',

                          justifyContent:
                            'space-between',

                          alignItems:
                            'center',

                          marginTop:
                            '10px',

                        }}

                      >

                        <div

                          style={{

                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              '6px',

                          }}

                        >

                          <button

                            type="button"

                            className="secondary-button"

                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }

                            disabled={
                              saving
                            }

                          >

                            −

                          </button>


                          <strong

                            style={{

                              minWidth:
                                '28px',

                              textAlign:
                                'center',

                            }}

                          >

                            {
                              item.quantity
                            }

                          </strong>


                          <button

                            type="button"

                            className="secondary-button"

                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }

                            disabled={

                              saving ||
                              item.quantity >= stock

                            }

                          >

                            +

                          </button>

                        </div>


                        <button

                          type="button"

                          className="delete-button"

                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }

                          disabled={
                            saving
                          }

                        >

                          Eliminar

                        </button>

                      </div>


                      {/* =================================
                          PROMOCIÓN
                      ================================== */}

                      {hasPromotions && (

                        <div

                          style={{

                            marginTop:
                              '14px',

                            padding:
                              '12px',

                            borderRadius:
                              '10px',

                            background:
                              'var(--green-50)',

                            border:
                              '1px solid var(--green-200, #bbf7d0)',

                          }}

                        >

                          <label

                            style={{

                              display:
                                'block',

                              fontSize:
                                '12px',

                              fontWeight:
                                '700',

                              marginBottom:
                                '7px',

                            }}

                          >

                            🏷️ Promoción

                          </label>


                          <select

                            value={

                              item.selectedPromotion
                                ? `${item.selectedPromotion.quantity}-${item.selectedPromotion.price}`
                                : ''

                            }

                            onChange={event => {

                              const value =
                                event.target.value


                              setCart(
                                current =>

                                  current.map(
                                    cartItem => {

                                      if (
                                        cartItem.id !==
                                        item.id
                                      ) {

                                        return cartItem

                                      }


                                      if (
                                        !value
                                      ) {

                                        return {

                                          ...cartItem,

                                          selectedPromotion:
                                            null,

                                        }

                                      }


                                      const [
                                        promotionQuantity,
                                        promotionPrice
                                      ] =
                                        value.split(
                                          '-'
                                        )


                                      const promotion =
                                        cartItem.promotions.find(
                                          promo =>

                                            Number(
                                              promo.quantity
                                            ) ===
                                              Number(
                                                promotionQuantity
                                              ) &&

                                            Number(
                                              promo.price
                                            ) ===
                                              Number(
                                                promotionPrice
                                              )

                                        )


                                      return {

                                        ...cartItem,

                                        selectedPromotion:
                                          promotion ||
                                          null,

                                      }

                                    }
                                  )

                              )

                            }}

                            disabled={
                              saving
                            }

                            style={{

                              width:
                                '100%',

                              padding:
                                '9px',

                              borderRadius:
                                '8px',

                              border:
                                '1px solid var(--border)',

                              background:
                                'var(--surface, #fff)',

                            }}

                          >

                            <option value="">

                              Sin promoción

                            </option>


                            {item.promotions.map(
                              promotion => (

                                <option

                                  key={

                                    `${promotion.quantity}-${promotion.price}`

                                  }

                                  value={

                                    `${promotion.quantity}-${promotion.price}`

                                  }

                                >

                                  {promotion.quantity}{' '}
                                  por{' '}
                                  {formatCurrency(
                                    promotion.price
                                  )}

                                </option>

                              )
                            )}

                          </select>


                          {/* =================================
                              INFORMACIÓN DEL PRECIO
                          ================================== */}

                          {item.selectedPromotion && (

                            <div

                              style={{

                                marginTop:
                                  '10px',

                                fontSize:
                                  '12px',

                              }}

                            >

                              <div

                                style={{

                                  display:
                                    'flex',

                                  justifyContent:
                                    'space-between',

                                  marginBottom:
                                    '5px',

                                }}

                              >

                                <span>

                                  Precio normal:

                                </span>

                                <span

                                  style={{

                                    textDecoration:
                                      'line-through',

                                    color:
                                      'var(--text-secondary)',

                                  }}

                                >

                                  {formatCurrency(
                                    normalTotal
                                  )}

                                </span>

                              </div>


                              <div

                                style={{

                                  display:
                                    'flex',

                                  justifyContent:
                                    'space-between',

                                  marginBottom:
                                    '5px',

                                }}

                              >

                                <span>

                                  Precio promoción:

                                </span>

                                <strong

                                  style={{

                                    color:
                                      'var(--green-700)',

                                  }}

                                >

                                  {formatCurrency(
                                    saleTotal
                                  )}

                                </strong>

                              </div>


                              {itemDiscount > 0 && (

                                <div

                                  style={{

                                    display:
                                      'flex',

                                    justifyContent:
                                      'space-between',

                                  }}

                                >

                                  <span>

                                    Ahorro:

                                  </span>

                                  <strong

                                    style={{

                                      color:
                                        'var(--green-700)',

                                    }}

                                  >

                                    {formatCurrency(
                                      itemDiscount
                                    )}

                                  </strong>

                                </div>

                              )}


                              <div

                                style={{

                                  marginTop:
                                    '7px',

                                  paddingTop:
                                    '7px',

                                  borderTop:
                                    '1px solid var(--border)',

                                  color:
                                    'var(--text-secondary)',

                                }}

                              >

                                Precio efectivo:

                                {' '}

                                <strong>

                                  {formatCurrency(
                                    effectiveUnitPrice
                                  )}

                                  {' '}c/u

                                </strong>

                              </div>

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  )

                })}

              </div>


              {/* =================================
                  COBRO
              ================================== */}

              <div

                style={{

                  marginTop:
                    '20px',

                }}

              >

                <div className="form-group">

                  <label>
                    Costo de envío
                  </label>

                  <input

                    type="number"

                    min="0"

                    step="0.01"

                    value={
                      shippingCost
                    }

                    onChange={event =>
                      setShippingCost(
                        event.target.value
                      )
                    }

                    placeholder="0.00"

                    disabled={
                      saving
                    }

                  />

                </div>


                {/* RESUMEN */}

                <div

                  style={{

                    marginTop:
                      '18px',

                    padding:
                      '15px',

                    borderRadius:
                      '12px',

                    background:
                      'var(--green-50)',

                  }}

                >

                  <div

                    className="status-row"

                    style={{
                      marginBottom:
                        '8px'
                    }}

                  >

                    <span>
                      Productos
                    </span>

                    <strong>
                      {totalItems}
                    </strong>

                  </div>


                  <div

                    className="status-row"

                    style={{
                      marginBottom:
                        '8px'
                    }}

                  >

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        subtotal
                      )}
                    </strong>

                  </div>


                  <div

                    className="status-row"

                    style={{
                      marginBottom:
                        '8px'
                    }}

                  >

                    <span>
                      Envío
                    </span>

                    <strong>
                      {formatCurrency(
                        shipping
                      )}
                    </strong>

                  </div>


                  <div

                    className="status-row"

                    style={{

                      paddingTop:
                        '10px',

                      borderTop:
                        '1px solid var(--border)',

                    }}

                  >

                    <span>
                      Total
                    </span>

                    <strong

                      style={{

                        color:
                          'var(--green-700)',

                        fontSize:
                          '22px',

                      }}

                    >

                      {formatCurrency(
                        total
                      )}

                    </strong>

                  </div>

                </div>


                {/* UTILIDAD */}

                <div

                  style={{

                    marginTop:
                      '10px',

                    padding:
                      '10px 12px',

                    borderRadius:
                      '9px',

                    background:
                      'var(--surface-secondary, #f8faf8)',

                    fontSize:
                      '12px',

                  }}

                >

                  <span>
                    Utilidad estimada
                  </span>


                  <strong

                    style={{

                      float:
                        'right',

                      color:
                        estimatedProfit >= 0

                          ? 'var(--green-700)'

                          : 'var(--danger)',

                    }}

                  >

                    {formatCurrency(
                      estimatedProfit
                    )}

                  </strong>

                </div>


                {/* PAGO */}

                <div

                  className="form-group"

                  style={{

                    marginTop:
                      '18px',

                  }}

                >

                  <label>
                    Pago recibido
                  </label>

                  <input

                    type="number"

                    min="0"

                    step="0.01"

                    value={
                      payment
                    }

                    onChange={event =>
                      setPayment(
                        event.target.value
                      )
                    }

                    placeholder="0.00"

                    disabled={
                      saving
                    }

                  />

                </div>


                {/* CAMBIO */}

                <div

                  style={{

                    padding:
                      '13px',

                    borderRadius:
                      '10px',

                    background:

                      change >= 0

                        ? 'var(--green-50)'

                        : 'var(--danger-light)',

                    border:

                      `1px solid ${
                        change >= 0

                          ? 'var(--green-200, #bbf7d0)'

                          : 'var(--danger)'

                      }`,

                  }}

                >

                  <span>

                    {change >= 0

                      ? 'Cambio'

                      : 'Falta por pagar'}

                  </span>


                  <strong

                    style={{

                      float:
                        'right',

                      color:

                        change >= 0

                          ? 'var(--green-700)'

                          : 'var(--danger)',

                    }}

                  >

                    {formatCurrency(
                      Math.abs(change)
                    )}

                  </strong>

                </div>


                {/* COBRAR */}

                <button

                  className="primary-button"

                  style={{

                    width:
                      '100%',

                    marginTop:
                      '15px',

                    minHeight:
                      '48px',

                    fontSize:
                      '15px',

                  }}

                  disabled={

                    saving ||
                    paymentAmount < total

                  }

                  onClick={
                    handleSale
                  }

                >

                  {saving

                    ? 'Registrando venta...'

                    : '💵 Cobrar venta'

                  }

                </button>

              </div>

            </>

          )}

        </div>

      </div>

    </section>

  )

}


export default PuntoVenta
