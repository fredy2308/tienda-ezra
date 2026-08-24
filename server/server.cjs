const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')

const app = express()

const PORT = 3001


// ========================================
// CONFIGURACIÓN
// ========================================

app.use(cors())

app.use(express.json())


// ========================================
// BASE DE DATOS
// ========================================

const db = new Database('./server/ezra.db')


// Activar claves foráneas
db.pragma('foreign_keys = ON')


// ========================================
// TABLA PRODUCTOS
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    category TEXT NOT NULL,

    cost REAL NOT NULL DEFAULT 0,

    price REAL NOT NULL DEFAULT 0,

    stock INTEGER NOT NULL DEFAULT 0,

    minimum_stock INTEGER NOT NULL DEFAULT 0,

    unit TEXT NOT NULL DEFAULT 'pieza',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

  )
`).run()


// ========================================
// TABLA COMPRAS
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS purchases (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    description TEXT NOT NULL,

    total_cost REAL NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    purchase_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT

  )
`).run()


// ========================================
// COMPATIBILIDAD COMPRAS
// ========================================

try {

  db.prepare(`
    ALTER TABLE purchases
    ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
  `).run()

} catch (error) {

  if (
    !error.message.toLowerCase().includes(
      'duplicate column name'
    )
  ) {

    throw error

  }

}


// ========================================
// TABLA MOVIMIENTOS DE INVENTARIO
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS inventory_movements (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_id INTEGER NOT NULL,

    type TEXT NOT NULL,

    quantity INTEGER NOT NULL,

    unit_cost REAL NOT NULL DEFAULT 0,

    reference_id INTEGER,

    description TEXT,

    movement_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
      REFERENCES products(id)

  )
`).run()


// ========================================
// TABLA TRANSFORMACIONES
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS transformations (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    purchase_id INTEGER,

    source_product_id INTEGER,

    source_quantity INTEGER NOT NULL DEFAULT 1,

    source_description TEXT NOT NULL,

    source_cost REAL NOT NULL DEFAULT 0,

    transformation_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT,

    FOREIGN KEY (purchase_id)
      REFERENCES purchases(id),

    FOREIGN KEY (source_product_id)
      REFERENCES products(id)

  )
`).run()


// ========================================
// COMPATIBILIDAD TRANSFORMACIONES
// ========================================

try {

  db.prepare(`
    ALTER TABLE transformations
    ADD COLUMN source_product_id INTEGER
  `).run()

} catch (error) {

  if (
    !error.message.toLowerCase().includes(
      'duplicate column name'
    )
  ) {

    throw error

  }

}


try {

  db.prepare(`
    ALTER TABLE transformations
    ADD COLUMN source_quantity INTEGER NOT NULL DEFAULT 1
  `).run()

} catch (error) {

  if (
    !error.message.toLowerCase().includes(
      'duplicate column name'
    )
  ) {

    throw error

  }

}


// ========================================
// RESULTADOS DE TRANSFORMACIONES
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS transformation_outputs (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transformation_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL,

    sale_price REAL NOT NULL DEFAULT 0,

    allocated_cost REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (transformation_id)
      REFERENCES transformations(id),

    FOREIGN KEY (product_id)
      REFERENCES products(id)

  )
`).run()


// ========================================
// TABLA GASTOS
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    description TEXT NOT NULL,

    category TEXT NOT NULL DEFAULT 'Operación',

    amount REAL NOT NULL DEFAULT 0,

    payment_method TEXT NOT NULL DEFAULT 'Efectivo',

    expense_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

  )
`).run()


// ========================================
// TABLA VENTAS
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS sales (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    subtotal REAL NOT NULL DEFAULT 0,

    shipping_cost REAL NOT NULL DEFAULT 0,

    total REAL NOT NULL DEFAULT 0,

    payment REAL NOT NULL DEFAULT 0,

    change REAL NOT NULL DEFAULT 0,

    payment_method TEXT NOT NULL DEFAULT 'Efectivo',

    sale_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT

  )
`).run()


// ========================================
// COMPATIBILIDAD VENTAS
// ========================================

try {

  db.prepare(`
    ALTER TABLE sales
    ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'Efectivo'
  `).run()

} catch (error) {

  if (
    !error.message.toLowerCase().includes(
      'duplicate column name'
    )
  ) {

    throw error

  }

}


try {

  db.prepare(`
    ALTER TABLE sales
    ADD COLUMN notes TEXT
  `).run()

} catch (error) {

  if (
    !error.message.toLowerCase().includes(
      'duplicate column name'
    )
  ) {

    throw error

  }

}


// ========================================
// DETALLE DE VENTAS
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS sale_items (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sale_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price REAL NOT NULL DEFAULT 0,

    unit_cost REAL NOT NULL DEFAULT 0,

    subtotal REAL NOT NULL DEFAULT 0,

    cost_total REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (sale_id)
      REFERENCES sales(id),

    FOREIGN KEY (product_id)
      REFERENCES products(id)

  )
`).run()

// ========================================
// TABLA PROMOCIONES
// ========================================
//
// Una promoción pertenece a un producto.
//
// Ejemplo:
//
// Producto: Planta de $35
//
// quantity = 2
// promotion_price = 60
//
// Significa:
// 2 piezas por $60
//
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS promotions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL,

    promotion_price REAL NOT NULL DEFAULT 0,

    active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
      REFERENCES products(id)

  )
`).run()


// ========================================
// TABLA CORTES
// ========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS cash_cuts (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    cut_date TEXT NOT NULL,

    period_start TEXT,

    period_end TEXT,

    sales_count INTEGER NOT NULL DEFAULT 0,

    sales_total REAL NOT NULL DEFAULT 0,

    sales_subtotal REAL NOT NULL DEFAULT 0,

    shipping_total REAL NOT NULL DEFAULT 0,

    product_cost REAL NOT NULL DEFAULT 0,

    gross_profit REAL NOT NULL DEFAULT 0,

    expenses_total REAL NOT NULL DEFAULT 0,

    net_profit REAL NOT NULL DEFAULT 0,

    cash_expected REAL NOT NULL DEFAULT 0,

    cash_counted REAL NOT NULL DEFAULT 0,

    difference REAL NOT NULL DEFAULT 0,

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

  )
`).run()


// ========================================
// RUTA PRINCIPAL
// ========================================

app.get('/api', (req, res) => {

  res.json({
    message: 'Servidor Ezra funcionando correctamente'
  })

})


// ========================================
// PRODUCTOS
// ========================================


// ========================================
// OBTENER PRODUCTOS
// ========================================

app.get('/api/products', (req, res) => {

  try {

    const products = db.prepare(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `).all()


    const getPromotions = db.prepare(`
      SELECT
        id,
        product_id,
        quantity,
        promotion_price,
        active,
        created_at
      FROM promotions
      WHERE product_id = ?
        AND active = 1
      ORDER BY
        quantity ASC,
        promotion_price ASC
    `)


    const productsWithPromotions =
      products.map(product => {

        const promotions =
          getPromotions.all(product.id)


        return {

          ...product,

          promotions: promotions.map(
            promotion => ({

              id: Number(
                promotion.id
              ),

              productId: Number(
                promotion.product_id
              ),

              quantity: Number(
                promotion.quantity
              ),

              price: Number(
                promotion.promotion_price
              ),

              active: Boolean(
                promotion.active
              ),

              createdAt:
                promotion.created_at,

            })
          ),

        }

      })


    res.json(
      productsWithPromotions
    )


  } catch (error) {

    console.error(
      'Error obteniendo productos:',
      error
    )


    res.status(500).json({

      error:
        'No se pudieron obtener los productos.'

    })

  }

})


// ========================================
// PROMOCIONES
// ========================================


// ========================================
// CREAR PROMOCIÓN
// ========================================
//
// POST /api/promotions
//
// Ejemplo:
//
// {
//   "productId": 19,
//   "quantity": 2,
//   "promotionPrice": 60
// }
//
// ========================================

app.post('/api/promotions', (req, res) => {

  try {

    const {
      productId,
      quantity,
      promotionPrice
    } = req.body


    const numericProductId =
      Number(productId)

    const numericQuantity =
      Number(quantity)

    const numericPromotionPrice =
      Number(promotionPrice)


    // ==================================
    // VALIDAR PRODUCTO
    // ==================================

    if (
      !Number.isInteger(numericProductId) ||
      numericProductId <= 0
    ) {

      return res.status(400).json({

        error:
          'El producto no es válido.'

      })

    }


    // ==================================
    // VALIDAR CANTIDAD
    // ==================================

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 2
    ) {

      return res.status(400).json({

        error:
          'La cantidad de la promoción debe ser un entero mayor o igual a 2.'

      })

    }


    // ==================================
    // VALIDAR PRECIO PROMOCIONAL
    // ==================================

    if (
      !Number.isFinite(
        numericPromotionPrice
      ) ||
      numericPromotionPrice <= 0
    ) {

      return res.status(400).json({

        error:
          'El precio de la promoción debe ser mayor a cero.'

      })

    }


    // ==================================
    // BUSCAR PRODUCTO
    // ==================================

    const product = db.prepare(`
      SELECT *
      FROM products
      WHERE id = ?
    `).get(numericProductId)


    if (!product) {

      return res.status(404).json({

        error:
          'El producto seleccionado no existe.'

      })

    }


    // ==================================
    // VALIDAR PRECIO NORMAL
    // ==================================

    const normalTotal =
      Number(product.price || 0) *
      numericQuantity


    if (
      numericPromotionPrice >=
      normalTotal
    ) {

      return res.status(400).json({

        error:
          `El precio promocional debe ser menor al precio normal de ${numericQuantity} unidades (${normalTotal.toFixed(2)}).`

      })

    }


    // ==================================
    // EVITAR DUPLICADOS ACTIVOS
    // ==================================

    const existingPromotion =
      db.prepare(`
        SELECT *
        FROM promotions
        WHERE product_id = ?
          AND quantity = ?
          AND active = 1
      `).get(
        numericProductId,
        numericQuantity
      )


    if (existingPromotion) {

      return res.status(400).json({

        error:
          `Ya existe una promoción activa para ${numericQuantity} unidades de este producto.`

      })

    }


    // ==================================
    // CREAR PROMOCIÓN
    // ==================================

    const result =
      db.prepare(`
        INSERT INTO promotions
        (
          product_id,
          quantity,
          promotion_price,
          active
        )
        VALUES
        (
          @productId,
          @quantity,
          @promotionPrice,
          1
        )
      `).run({

        productId:
          numericProductId,

        quantity:
          numericQuantity,

        promotionPrice:
          Number(
            numericPromotionPrice.toFixed(2)
          )

      })


    // ==================================
    // OBTENER PROMOCIÓN CREADA
    // ==================================

    const promotion =
      db.prepare(`
        SELECT

          promotions.id,

          promotions.product_id,

          promotions.quantity,

          promotions.promotion_price,

          promotions.active,

          promotions.created_at,

          products.name
            AS product_name,

          products.price
            AS normal_price

        FROM promotions

        INNER JOIN products
          ON products.id =
             promotions.product_id

        WHERE promotions.id = ?

      `).get(
        Number(
          result.lastInsertRowid
        )
      )


    // ==================================
    // RESPUESTA
    // ==================================

    res.status(201).json({

      message:
        'Promoción creada correctamente.',

      promotion: {

        id:
          Number(
            promotion.id
          ),

        productId:
          Number(
            promotion.product_id
          ),

        productName:
          promotion.product_name,

        quantity:
          Number(
            promotion.quantity
          ),

        promotionPrice:
          Number(
            promotion.promotion_price
          ),

        normalPrice:
          Number(
            promotion.normal_price
          ),

        active:
          Boolean(
            promotion.active
          ),

        createdAt:
          promotion.created_at

      }

    })


  } catch (error) {

    console.error(
      'Error creando promoción:',
      error
    )


    res.status(500).json({

      error:
        error.message ||
        'No se pudo crear la promoción.'

    })

  }

})


// ========================================
// OBTENER TODAS LAS PROMOCIONES
// ========================================
//
// GET /api/promotions
//
// ========================================

app.get('/api/promotions', (req, res) => {

  try {

    const promotions =
      db.prepare(`
        SELECT

          promotions.id,

          promotions.product_id,

          promotions.quantity,

          promotions.promotion_price,

          promotions.active,

          promotions.created_at,

          products.name
            AS product_name,

          products.price
            AS normal_price,

          products.stock
            AS product_stock,

          products.unit
            AS product_unit

        FROM promotions

        INNER JOIN products
          ON products.id =
             promotions.product_id

        ORDER BY

          products.name ASC,

          promotions.quantity ASC

      `).all()


    res.json(

      promotions.map(
        promotion => ({

          id:
            Number(
              promotion.id
            ),

          productId:
            Number(
              promotion.product_id
            ),

          productName:
            promotion.product_name,

          quantity:
            Number(
              promotion.quantity
            ),

          promotionPrice:
            Number(
              promotion.promotion_price
            ),

          normalPrice:
            Number(
              promotion.normal_price
            ),

          active:
            Boolean(
              promotion.active
            ),

          stock:
            Number(
              promotion.product_stock
            ) || 0,

          unit:
            promotion.product_unit,

          createdAt:
            promotion.created_at

        })
      )

    )


  } catch (error) {

    console.error(
      'Error obteniendo promociones:',
      error
    )


    res.status(500).json({

      error:
        'No se pudieron obtener las promociones.'

    })

  }

})


// ========================================
// ACTIVAR / DESACTIVAR PROMOCIÓN
// ========================================
//
// PATCH /api/promotions/:id
//
// ========================================

app.patch(
  '/api/promotions/:id',
  (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        )


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({

          error:
            'ID de promoción no válido.'

        })

      }


      const active =
        req.body.active


      if (
        typeof active !== 'boolean'
      ) {

        return res.status(400).json({

          error:
            'El campo active debe ser verdadero o falso.'

        })

      }


      const promotion =
        db.prepare(`
          SELECT *
          FROM promotions
          WHERE id = ?
        `).get(id)


      if (!promotion) {

        return res.status(404).json({

          error:
            'Promoción no encontrada.'

        })

      }


      db.prepare(`
        UPDATE promotions

        SET active = @active

        WHERE id = @id

      `).run({

        id,

        active:
          active ? 1 : 0

      })


      const updatedPromotion =
        db.prepare(`
          SELECT

            promotions.id,

            promotions.product_id,

            promotions.quantity,

            promotions.promotion_price,

            promotions.active,

            promotions.created_at,

            products.name
              AS product_name,

            products.price
              AS normal_price

          FROM promotions

          INNER JOIN products
            ON products.id =
               promotions.product_id

          WHERE promotions.id = ?

        `).get(id)


      res.json({

        message:
          active
            ? 'Promoción activada correctamente.'
            : 'Promoción desactivada correctamente.',

        promotion: {

          id:
            Number(
              updatedPromotion.id
            ),

          productId:
            Number(
              updatedPromotion.product_id
            ),

          productName:
            updatedPromotion.product_name,

          quantity:
            Number(
              updatedPromotion.quantity
            ),

          promotionPrice:
            Number(
              updatedPromotion.promotion_price
            ),

          normalPrice:
            Number(
              updatedPromotion.normal_price
            ),

          active:
            Boolean(
              updatedPromotion.active
            ),

          createdAt:
            updatedPromotion.created_at

        }

      })


    } catch (error) {

      console.error(
        'Error actualizando promoción:',
        error
      )


      res.status(500).json({

        error:
          error.message ||
          'No se pudo actualizar la promoción.'

      })

    }

  }
)


// ========================================
// ELIMINAR PROMOCIÓN
// ========================================
//
// DELETE /api/promotions/:id
//
// ========================================

app.delete(
  '/api/promotions/:id',
  (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        )


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({

          error:
            'ID de promoción no válido.'

        })

      }


      const promotion =
        db.prepare(`
          SELECT

            promotions.*,

            products.name
              AS product_name

          FROM promotions

          INNER JOIN products
            ON products.id =
               promotions.product_id

          WHERE promotions.id = ?

        `).get(id)


      if (!promotion) {

        return res.status(404).json({

          error:
            'Promoción no encontrada.'

        })

      }


      const result =
        db.prepare(`
          DELETE FROM promotions
          WHERE id = ?
        `).run(id)


      if (
        result.changes === 0
      ) {

        throw new Error(
          'No se pudo eliminar la promoción.'
        )

      }


      res.json({

        message:
          'Promoción eliminada correctamente.',

        promotion: {

          id:
            Number(
              promotion.id
            ),

          productId:
            Number(
              promotion.product_id
            ),

          productName:
            promotion.product_name,

          quantity:
            Number(
              promotion.quantity
            ),

          promotionPrice:
            Number(
              promotion.promotion_price
            )

        }

      })


    } catch (error) {

      console.error(
        'Error eliminando promoción:',
        error
      )


      res.status(500).json({

        error:
          error.message ||
          'No se pudo eliminar la promoción.'

      })

    }

  }
)
// ========================================
// AGREGAR PRODUCTO
// ========================================

app.post('/api/products', (req, res) => {

  try {

    const {

      name,
      category,
      cost,
      price,
      stock,
      minimumStock,
      unit,

    } = req.body


    const cleanName =
      String(name || '').trim()

    const cleanCategory =
      String(category || '').trim()

    const cleanUnit =
      String(unit || 'pieza').trim() ||
      'pieza'


    if (!cleanName) {

      return res.status(400).json({

        error:
          'El nombre es obligatorio.'

      })

    }


    if (!cleanCategory) {

      return res.status(400).json({

        error:
          'La categoría es obligatoria.'

      })

    }


    const numericCost =
      Number(cost) || 0

    const numericPrice =
      Number(price) || 0

    const numericStock =
      Number(stock) || 0

    const numericMinimumStock =
      Number(minimumStock) || 0


    if (
      !Number.isFinite(numericCost) ||
      numericCost < 0
    ) {

      return res.status(400).json({

        error:
          'El costo no es válido.'

      })

    }


    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {

      return res.status(400).json({

        error:
          'El precio no es válido.'

      })

    }


    if (
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {

      return res.status(400).json({

        error:
          'El stock debe ser un entero mayor o igual a cero.'

      })

    }


    if (
      !Number.isInteger(numericMinimumStock) ||
      numericMinimumStock < 0
    ) {

      return res.status(400).json({

        error:
          'El stock mínimo debe ser un entero mayor o igual a cero.'

      })

    }


    const createProduct =
      db.transaction(() => {

        const result =
          db.prepare(`
            INSERT INTO products
            (
              name,
              category,
              cost,
              price,
              stock,
              minimum_stock,
              unit
            )

            VALUES
            (
              @name,
              @category,
              @cost,
              @price,
              @stock,
              @minimumStock,
              @unit
            )
          `).run({

            name:
              cleanName,

            category:
              cleanCategory,

            cost:
              numericCost,

            price:
              numericPrice,

            stock:
              numericStock,

            minimumStock:
              numericMinimumStock,

            unit:
              cleanUnit,

          })


        const productId =
          Number(
            result.lastInsertRowid
          )


        if (numericStock > 0) {

          db.prepare(`
            INSERT INTO inventory_movements
            (
              product_id,
              type,
              quantity,
              unit_cost,
              description
            )

            VALUES
            (
              @productId,
              'entrada',
              @quantity,
              @unitCost,
              @description
            )
          `).run({

            productId,

            quantity:
              numericStock,

            unitCost:
              numericCost,

            description:
              'Stock inicial del producto',

          })

        }


        return db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(productId)

      })()


    res.status(201).json(createProduct)

  } catch (error) {

    console.error(
      'Error agregando producto:',
      error
    )

    res.status(500).json({

      error:
        error.message ||
        'No se pudo agregar el producto.'

    })

  }

})


// ========================================
// ELIMINAR PRODUCTO
// ========================================

app.delete('/api/products/:id', (req, res) => {

  const id =
    Number(req.params.id)


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({

      error:
        'ID de producto no válido.'

    })

  }


  try {

    const deleted =
      db.transaction(() => {

        const product =
          db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
          `).get(id)


        if (!product) {

          throw new Error(
            'Producto no encontrado.'
          )

        }


        // No permitimos borrar un producto
        // que tenga ventas históricas.
        const saleItems =
          db.prepare(`
            SELECT COUNT(*) AS count
            FROM sale_items
            WHERE product_id = ?
          `).get(id)


        if (
          Number(saleItems.count) > 0
        ) {

          throw new Error(
            'No se puede eliminar el producto porque tiene ventas registradas.'
          )

        }


        db.prepare(`
          DELETE FROM inventory_movements
          WHERE product_id = ?
        `).run(id)


        db.prepare(`
          DELETE FROM transformation_outputs
          WHERE product_id = ?
        `).run(id)


        db.prepare(`
          UPDATE transformations
          SET source_product_id = NULL
          WHERE source_product_id = ?
        `).run(id)


        const result =
          db.prepare(`
            DELETE FROM products
            WHERE id = ?
          `).run(id)


        if (result.changes === 0) {

          throw new Error(
            'No se pudo eliminar el producto.'
          )

        }


        return product

      })()


    res.json({

      message:
        'Producto eliminado correctamente.',

      product: {

        id:
          deleted.id,

        name:
          deleted.name,

      },

    })

  } catch (error) {

    console.error(
      'Error eliminando producto:',
      error
    )

    res.status(400).json({

      error:
        error.message ||
        'No se pudo eliminar el producto.'

    })

  }

})


// ========================================
// COMPRAS
// ========================================


// ========================================
// REGISTRAR COMPRA
// ========================================

app.post('/api/purchases', (req, res) => {

  const {

    name,
    category,
    quantity,
    totalCost,
    price,
    minimumStock,
    unit,
    notes,

  } = req.body


  const cleanName =
    String(name || '').trim()

  const cleanCategory =
    String(category || '').trim()

  const cleanUnit =
    String(unit || 'pieza').trim() ||
    'pieza'

  const numericQuantity =
    Number(quantity)

  const numericTotalCost =
    Number(totalCost)

  const numericPrice =
    Number(price)

  const numericMinimumStock =
    Number(minimumStock || 0)


  if (!cleanName) {

    return res.status(400).json({

      error:
        'El nombre del producto es obligatorio.'

    })

  }


  if (!cleanCategory) {

    return res.status(400).json({

      error:
        'La categoría es obligatoria.'

    })

  }


  if (
    !Number.isInteger(numericQuantity) ||
    numericQuantity <= 0
  ) {

    return res.status(400).json({

      error:
        'La cantidad debe ser un número entero mayor a cero.'

    })

  }


  if (
    !Number.isFinite(numericTotalCost) ||
    numericTotalCost < 0
  ) {

    return res.status(400).json({

      error:
        'El costo total no es válido.'

    })

  }


  if (
    !Number.isFinite(numericPrice) ||
    numericPrice < 0
  ) {

    return res.status(400).json({

      error:
        'El precio de venta no es válido.'

    })

  }


  if (
    !Number.isFinite(numericMinimumStock) ||
    numericMinimumStock < 0
  ) {

    return res.status(400).json({

      error:
        'El stock mínimo no es válido.'

    })

  }


  const unitCost =
    numericTotalCost /
    numericQuantity


  try {

    const result =
      db.transaction(() => {

        const purchaseResult =
          db.prepare(`
            INSERT INTO purchases
            (
              description,
              total_cost,
              quantity,
              notes
            )

            VALUES
            (
              @description,
              @totalCost,
              @quantity,
              @notes
            )
          `).run({

            description:
              cleanName,

            totalCost:
              numericTotalCost,

            quantity:
              numericQuantity,

            notes:
              notes || null,

          })


        const purchaseId =
          Number(
            purchaseResult.lastInsertRowid
          )


        const existingProduct =
          db.prepare(`
            SELECT *
            FROM products
            WHERE LOWER(TRIM(name)) =
                  LOWER(TRIM(?))
            LIMIT 1
          `).get(cleanName)


        let product


        if (existingProduct) {

          const newStock =
            Number(existingProduct.stock || 0) +
            numericQuantity


          db.prepare(`
            UPDATE products

            SET

              category = @category,

              cost = @cost,

              price = @price,

              stock = @stock,

              minimum_stock = @minimumStock,

              unit = @unit

            WHERE id = @productId
          `).run({

            category:
              cleanCategory,

            cost:
              unitCost,

            price:
              numericPrice,

            stock:
              newStock,

            minimumStock:
              numericMinimumStock,

            unit:
              cleanUnit,

            productId:
              existingProduct.id,

          })


          product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(
              existingProduct.id
            )

        } else {

          const productResult =
            db.prepare(`
              INSERT INTO products
              (
                name,
                category,
                cost,
                price,
                stock,
                minimum_stock,
                unit
              )

              VALUES
              (
                @name,
                @category,
                @cost,
                @price,
                @stock,
                @minimumStock,
                @unit
              )
            `).run({

              name:
                cleanName,

              category:
                cleanCategory,

              cost:
                unitCost,

              price:
                numericPrice,

              stock:
                numericQuantity,

              minimumStock:
                numericMinimumStock,

              unit:
                cleanUnit,

            })


          product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(
              productResult.lastInsertRowid
            )

        }


        db.prepare(`
          INSERT INTO inventory_movements
          (
            product_id,
            type,
            quantity,
            unit_cost,
            reference_id,
            description
          )

          VALUES
          (
            @productId,
            'entrada',
            @quantity,
            @unitCost,
            @referenceId,
            @description
          )
        `).run({

          productId:
            product.id,

          quantity:
            numericQuantity,

          unitCost,

          referenceId:
            purchaseId,

          description:
            `Entrada por compra #${purchaseId}`,

        })


        const purchase =
          db.prepare(`
            SELECT *
            FROM purchases
            WHERE id = ?
          `).get(purchaseId)


        return {

          purchase,

          product,

        }

      })()


    res.status(201).json({

      message:
        'Compra registrada correctamente.',

      purchase:
        result.purchase,

      product:
        result.product,

    })

  } catch (error) {

    console.error(
      'Error registrando compra:',
      error
    )

    res.status(500).json({

      error:
        error.message ||
        'No se pudo registrar la compra.'

    })

  }

})


// ========================================
// OBTENER COMPRAS
// ========================================

app.get('/api/purchases', (req, res) => {

  try {

    const purchases =
      db.prepare(`
        SELECT *
        FROM purchases
        ORDER BY id DESC
      `).all()


    res.json(purchases)

  } catch (error) {

    console.error(
      'Error obteniendo compras:',
      error
    )

    res.status(500).json({

      error:
        'No se pudieron obtener las compras.'

    })

  }

})


// ========================================
// ELIMINAR COMPRA
// ========================================

app.delete('/api/purchases/:id', (req, res) => {

  const id =
    Number(req.params.id)


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({

      error:
        'ID de compra no válido.'

    })

  }


  try {

    const result =
      db.transaction(() => {

        const purchase =
          db.prepare(`
            SELECT *
            FROM purchases
            WHERE id = ?
          `).get(id)


        if (!purchase) {

          throw new Error(
            'Compra no encontrada.'
          )

        }


        const transformations =
          db.prepare(`
            SELECT *
            FROM transformations
            WHERE purchase_id = ?
            ORDER BY id ASC
          `).all(id)


        for (
          const transformation
          of transformations
        ) {

          const outputs =
            db.prepare(`
              SELECT *
              FROM transformation_outputs
              WHERE transformation_id = ?
            `).all(
              transformation.id
            )


          for (
            const output
            of outputs
          ) {

            const outputProduct =
              db.prepare(`
                SELECT *
                FROM products
                WHERE id = ?
              `).get(
                output.product_id
              )


            if (!outputProduct) {

              throw new Error(
                `El producto resultante con ID ${output.product_id} ya no existe.`
              )

            }


            const newStock =
              Number(outputProduct.stock) -
              Number(output.quantity)


            if (newStock < 0) {

              throw new Error(
                `No se puede eliminar la compra porque el stock del producto "${outputProduct.name}" sería negativo.`
              )

            }

          }

        }


        const movement =
          db.prepare(`
            SELECT *
            FROM inventory_movements
            WHERE reference_id = ?
              AND type = 'entrada'
              AND description = ?
            LIMIT 1
          `).get(

            id,

            `Entrada por compra #${id}`

          )


        if (movement) {

          const product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(
              movement.product_id
            )


          if (!product) {

            throw new Error(
              'El producto asociado a la compra ya no existe.'
            )

          }


          const newStock =
            Number(product.stock) -
            Number(movement.quantity)


          if (newStock < 0) {

            throw new Error(
              `No se puede eliminar la compra porque el stock actual (${product.stock}) es menor que las unidades de esta compra (${movement.quantity}).`
            )

          }

        }


        for (
          const transformation
          of transformations
        ) {

          const outputs =
            db.prepare(`
              SELECT *
              FROM transformation_outputs
              WHERE transformation_id = ?
            `).all(
              transformation.id
            )


          for (
            const output
            of outputs
          ) {

            db.prepare(`
              UPDATE products

              SET stock =
                stock - @quantity

              WHERE id = @productId
            `).run({

              quantity:
                output.quantity,

              productId:
                output.product_id,

            })

          }


          if (
            transformation.source_product_id
          ) {

            const sourceProduct =
              db.prepare(`
                SELECT *
                FROM products
                WHERE id = ?
              `).get(
                transformation.source_product_id
              )


            if (sourceProduct) {

              db.prepare(`
                UPDATE products

                SET stock =
                  stock + @quantity

                WHERE id = @productId
              `).run({

                quantity:
                  transformation.source_quantity,

                productId:
                  transformation.source_product_id,

              })

            }

          }


          db.prepare(`
            DELETE FROM inventory_movements
            WHERE reference_id = ?
          `).run(
            transformation.id
          )


          db.prepare(`
            DELETE FROM transformation_outputs
            WHERE transformation_id = ?
          `).run(
            transformation.id
          )


          db.prepare(`
            DELETE FROM transformations
            WHERE id = ?
          `).run(
            transformation.id
          )

        }


        if (movement) {

          db.prepare(`
            UPDATE products

            SET stock =
              stock - @quantity

            WHERE id = @productId
          `).run({

            quantity:
              movement.quantity,

            productId:
              movement.product_id,

          })


          db.prepare(`
            DELETE FROM inventory_movements
            WHERE id = ?
          `).run(
            movement.id
          )

        }


        const deleteResult =
          db.prepare(`
            DELETE FROM purchases
            WHERE id = ?
          `).run(id)


        if (deleteResult.changes === 0) {

          throw new Error(
            'No se pudo eliminar la compra.'
          )

        }


        return {

          purchase,

          revertedQuantity:
            movement
              ? Number(movement.quantity)
              : 0,

        }

      })()


    res.json({

      message:
        'Compra eliminada y stock revertido correctamente.',

      purchase: {

        id:
          result.purchase.id,

        description:
          result.purchase.description,

      },

      revertedQuantity:
        result.revertedQuantity,

    })

  } catch (error) {

    console.error(
      'Error eliminando compra:',
      error
    )

    res.status(400).json({

      error:
        error.message ||
        'No se pudo eliminar la compra.'

    })

  }

})


// ========================================
// TRANSFORMACIONES
// ========================================


// ========================================
// REGISTRAR TRANSFORMACIÓN
// ========================================

app.post('/api/transformations', (req, res) => {

  const {
    purchaseId,
    sourceProductId,
    sourceQuantity,
    sourceDescription,
    sourceCost,
    notes,
    outputs,
  } = req.body


  const productId =
    Number(sourceProductId)

  const quantityToTransform =
    Number(sourceQuantity)

  const sentSourceCost =
    Number(sourceCost)


  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {

    return res.status(400).json({
      error:
        'Debes indicar un producto de origen válido.'
    })

  }


  if (
    !Number.isInteger(quantityToTransform) ||
    quantityToTransform <= 0
  ) {

    return res.status(400).json({
      error:
        'La cantidad a transformar debe ser un número entero mayor a cero.'
    })

  }


  if (
    !sourceDescription ||
    !String(sourceDescription).trim()
  ) {

    return res.status(400).json({
      error:
        'Debes indicar el producto de origen.'
    })

  }


  if (
    !Array.isArray(outputs) ||
    outputs.length === 0
  ) {

    return res.status(400).json({
      error:
        'Debes indicar al menos un resultado.'
    })

  }


  try {

    const result =
      db.transaction(() => {

        const sourceProduct =
          db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
          `).get(productId)


        if (!sourceProduct) {

          throw new Error(
            'El producto de origen no existe.'
          )

        }


        if (
          Number(sourceProduct.stock) <
          quantityToTransform
        ) {

          throw new Error(
            `Stock insuficiente. Disponible: ${sourceProduct.stock} ${sourceProduct.unit}.`
          )

        }


        const sourceUnitCost =
          Number(sourceProduct.cost || 0)


        const calculatedSourceCost =
          sourceUnitCost *
          quantityToTransform


        if (
          !Number.isFinite(sentSourceCost) ||
          sentSourceCost <= 0
        ) {

          throw new Error(
            'El costo de origen no es válido.'
          )

        }


        if (
          Math.abs(
            sentSourceCost -
            calculatedSourceCost
          ) > 0.01
        ) {

          throw new Error(
            `El costo de origen no coincide. Costo esperado: ${calculatedSourceCost.toFixed(2)}.`
          )

        }


        const preparedOutputs = []

        let totalProductionValue = 0


        for (
          const output
          of outputs
        ) {

          const outputProductId =
            output.productId
              ? Number(output.productId)
              : null


          const outputQuantity =
            Number(output.quantity)


          const salePrice =
            Number(output.salePrice)


          const outputName =
            String(
              output.name ||
              output.productName ||
              ''
            ).trim()


          const outputCategory =
            String(
              output.category ||
              'planta'
            ).trim()


          const outputUnit =
            String(
              output.unit ||
              'pieza'
            ).trim() ||
            'pieza'


          if (
            !Number.isInteger(outputQuantity) ||
            outputQuantity <= 0
          ) {

            throw new Error(
              'La cantidad de un resultado debe ser un entero mayor a cero.'
            )

          }


          if (
            !Number.isFinite(salePrice) ||
            salePrice < 0
          ) {

            throw new Error(
              'El precio de venta de un resultado no es válido.'
            )

          }


          let outputProduct = null


          if (
            Number.isInteger(outputProductId) &&
            outputProductId > 0
          ) {

            outputProduct =
              db.prepare(`
                SELECT *
                FROM products
                WHERE id = ?
              `).get(outputProductId)


            if (!outputProduct) {

              throw new Error(
                `El producto resultante con ID ${outputProductId} no existe.`
              )

            }

          }


          if (
            !outputProduct &&
            outputName
          ) {

            outputProduct =
              db.prepare(`
                SELECT *
                FROM products
                WHERE LOWER(TRIM(name)) =
                      LOWER(TRIM(?))
                LIMIT 1
              `).get(outputName)

          }


          const outputValue =
            outputQuantity *
            salePrice


          totalProductionValue +=
            outputValue


          preparedOutputs.push({

            productId:
              outputProduct
                ? outputProduct.id
                : null,

            existingProduct:
              outputProduct,

            name:
              outputProduct
                ? outputProduct.name
                : outputName,

            category:
              outputProduct
                ? outputProduct.category
                : outputCategory,

            unit:
              outputProduct
                ? outputProduct.unit
                : outputUnit,

            quantity:
              outputQuantity,

            salePrice,

            outputValue,

          })

        }


        for (
          const output
          of preparedOutputs
        ) {

          if (
            !output.productId &&
            !output.name
          ) {

            throw new Error(
              'Uno de los productos resultantes nuevos no tiene nombre.'
            )

          }

        }


        if (
          !Number.isFinite(
            totalProductionValue
          ) ||
          totalProductionValue <= 0
        ) {

          throw new Error(
            'El valor total de venta de los resultados debe ser mayor a cero.'
          )

        }


        let totalAllocatedCost = 0


        preparedOutputs.forEach(
          (output, index) => {

            const rawCost =
              calculatedSourceCost *
              (
                output.outputValue /
                totalProductionValue
              )


            let allocatedCost


            if (
              index <
              preparedOutputs.length - 1
            ) {

              allocatedCost =
                Number(
                  rawCost.toFixed(2)
                )

            } else {

              const remaining =
                calculatedSourceCost -
                totalAllocatedCost


              allocatedCost =
                Number(
                  Math.max(
                    0,
                    remaining
                  ).toFixed(2)
                )

            }


            const unitCost =
              output.quantity > 0
                ? allocatedCost /
                  output.quantity
                : 0


            output.allocatedCost =
              allocatedCost


            output.unitCost =
              Number(
                unitCost.toFixed(2)
              )


            totalAllocatedCost +=
              allocatedCost

          }
        )


        if (
          Math.abs(
            totalAllocatedCost -
            calculatedSourceCost
          ) > 0.01
        ) {

          throw new Error(
            `El costo asignado (${totalAllocatedCost.toFixed(2)}) debe ser igual al costo consumido (${calculatedSourceCost.toFixed(2)}).`
          )

        }


        const transformationResult =
          db.prepare(`
            INSERT INTO transformations
            (
              purchase_id,
              source_product_id,
              source_quantity,
              source_description,
              source_cost,
              notes
            )

            VALUES
            (
              @purchaseId,
              @sourceProductId,
              @sourceQuantity,
              @sourceDescription,
              @sourceCost,
              @notes
            )
          `).run({

            purchaseId:
              purchaseId
                ? Number(purchaseId)
                : null,

            sourceProductId:
              productId,

            sourceQuantity:
              quantityToTransform,

            sourceDescription:
              String(
                sourceDescription
              ).trim(),

            sourceCost:
              calculatedSourceCost,

            notes:
              notes
                ? String(notes).trim()
                : null,

          })


        const transformationId =
          Number(
            transformationResult.lastInsertRowid
          )


        const updateSource =
          db.prepare(`
            UPDATE products

            SET stock =
              stock - @quantity

            WHERE id = @productId
              AND stock >= @quantity
          `).run({

            quantity:
              quantityToTransform,

            productId,

          })


        if (
          updateSource.changes === 0
        ) {

          throw new Error(
            'No se pudo descontar el stock del producto de origen.'
          )

        }


        db.prepare(`
          INSERT INTO inventory_movements
          (
            product_id,
            type,
            quantity,
            unit_cost,
            reference_id,
            description
          )

          VALUES
          (
            @productId,
            'salida',
            @quantity,
            @unitCost,
            @referenceId,
            @description
          )
        `).run({

          productId,

          quantity:
            quantityToTransform,

          unitCost:
            sourceUnitCost,

          referenceId:
            transformationId,

          description:
            `Salida por transformación #${transformationId}`,

        })


        for (
          const output
          of preparedOutputs
        ) {

          let finalProductId


          if (!output.productId) {

            const productResult =
              db.prepare(`
                INSERT INTO products
                (
                  name,
                  category,
                  cost,
                  price,
                  stock,
                  minimum_stock,
                  unit
                )

                VALUES
                (
                  @name,
                  @category,
                  @cost,
                  @price,
                  @stock,
                  @minimumStock,
                  @unit
                )
              `).run({

                name:
                  output.name,

                category:
                  output.category || 'General',

                cost:
                  output.unitCost,

                price:
                  output.salePrice,

                stock:
                  output.quantity,

                minimumStock:
                  0,

                unit:
                  output.unit,

              })


            finalProductId =
              Number(
                productResult.lastInsertRowid
              )

          } else {

            finalProductId =
              output.productId


            db.prepare(`
              UPDATE products

              SET

                stock =
                  stock + @quantity,

                cost =
                  @unitCost,

                price =
                  @salePrice

              WHERE id = @productId
            `).run({

              quantity:
                output.quantity,

              unitCost:
                output.unitCost,

              salePrice:
                output.salePrice,

              productId:
                finalProductId,

            })

          }


          db.prepare(`
            INSERT INTO transformation_outputs
            (
              transformation_id,
              product_id,
              quantity,
              sale_price,
              allocated_cost
            )

            VALUES
            (
              @transformationId,
              @productId,
              @quantity,
              @salePrice,
              @allocatedCost
            )
          `).run({

            transformationId,

            productId:
              finalProductId,

            quantity:
              output.quantity,

            salePrice:
              output.salePrice,

            allocatedCost:
              output.allocatedCost,

          })


          db.prepare(`
            INSERT INTO inventory_movements
            (
              product_id,
              type,
              quantity,
              unit_cost,
              reference_id,
              description
            )

            VALUES
            (
              @productId,
              'entrada',
              @quantity,
              @unitCost,
              @referenceId,
              @description
            )
          `).run({

            productId:
              finalProductId,

            quantity:
              output.quantity,

            unitCost:
              output.unitCost,

            referenceId:
              transformationId,

            description:
              `Entrada por transformación #${transformationId}`,

          })

        }


        return {

          transformationId,

          sourceProductId:
            productId,

          sourceQuantity:
            quantityToTransform,

          sourceCost:
            calculatedSourceCost,

          totalProductionValue,

          totalAllocatedCost,

          outputs:
            preparedOutputs.map(
              output => ({

                name:
                  output.name,

                quantity:
                  output.quantity,

                salePrice:
                  output.salePrice,

                allocatedCost:
                  output.allocatedCost,

                unitCost:
                  output.unitCost,

              })
            ),

        }

      })()


    res.status(201).json({

      message:
        'Transformación registrada correctamente.',

      transformationId:
        result.transformationId,

      sourceProductId:
        result.sourceProductId,

      sourceQuantity:
        result.sourceQuantity,

      sourceCost:
        result.sourceCost,

      totalProductionValue:
        result.totalProductionValue,

      totalAllocatedCost:
        result.totalAllocatedCost,

      outputs:
        result.outputs,

    })

  } catch (error) {

    console.error(
      'Error registrando transformación:',
      error
    )

    res.status(400).json({

      error:
        error.message ||
        'No se pudo registrar la transformación.'

    })

  }

})


// ========================================
// OBTENER TRANSFORMACIONES
// ========================================

app.get('/api/transformations', (req, res) => {

  try {

    const transformations =
      db.prepare(`
        SELECT

          transformations.*,

          products.name
            AS source_product_name,

          products.unit
            AS source_product_unit

        FROM transformations

        LEFT JOIN products
          ON products.id =
             transformations.source_product_id

        ORDER BY transformations.id DESC
      `).all()


    res.json(transformations)

  } catch (error) {

    console.error(
      'Error obteniendo transformaciones:',
      error
    )

    res.status(500).json({

      error:
        'No se pudieron obtener las transformaciones.'

    })

  }

})


// ========================================
// DETALLE TRANSFORMACIÓN
// ========================================

app.get('/api/transformations/:id', (req, res) => {

  try {

    const id =
      Number(req.params.id)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return res.status(400).json({

        error:
          'ID de transformación no válido.'

      })

    }


    const transformation =
      db.prepare(`
        SELECT

          transformations.*,

          products.name
            AS source_product_name,

          products.category
            AS source_product_category,

          products.unit
            AS source_product_unit

        FROM transformations

        LEFT JOIN products
          ON products.id =
             transformations.source_product_id

        WHERE transformations.id = ?
      `).get(id)


    if (!transformation) {

      return res.status(404).json({

        error:
          'Transformación no encontrada.'

      })

    }


    const outputs =
      db.prepare(`
        SELECT

          transformation_outputs.*,

          products.name
            AS product_name,

          products.category
            AS product_category,

          products.unit
            AS product_unit

        FROM transformation_outputs

        LEFT JOIN products
          ON products.id =
             transformation_outputs.product_id

        WHERE transformation_outputs.transformation_id = ?

        ORDER BY transformation_outputs.id ASC
      `).all(id)


    res.json({

      transformation,

      outputs,

    })

  } catch (error) {

    console.error(
      'Error obteniendo detalle de transformación:',
      error
    )

    res.status(500).json({

      error:
        'No se pudo obtener el detalle de la transformación.'

    })

  }

})


// ========================================
// ELIMINAR TRANSFORMACIÓN
// ========================================

app.delete('/api/transformations/:id', (req, res) => {

  const id =
    Number(req.params.id)


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({

      error:
        'ID de transformación no válido.'

    })

  }


  try {

    const result =
      db.transaction(() => {

        const transformation =
          db.prepare(`
            SELECT *
            FROM transformations
            WHERE id = ?
          `).get(id)


        if (!transformation) {

          throw new Error(
            'Transformación no encontrada.'
          )

        }


        const outputs =
          db.prepare(`
            SELECT *
            FROM transformation_outputs
            WHERE transformation_id = ?
          `).all(id)


        for (
          const output
          of outputs
        ) {

          const product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(
              output.product_id
            )


          if (!product) {

            throw new Error(
              `El producto resultante con ID ${output.product_id} ya no existe.`
            )

          }


          const newStock =
            Number(product.stock) -
            Number(output.quantity)


          if (newStock < 0) {

            throw new Error(
              `No se puede eliminar la transformación porque el stock de "${product.name}" sería negativo.`
            )

          }

        }


        for (
          const output
          of outputs
        ) {

          db.prepare(`
            UPDATE products

            SET stock =
              stock - @quantity

            WHERE id = @productId
          `).run({

            quantity:
              output.quantity,

            productId:
              output.product_id,

          })

        }


        if (
          transformation.source_product_id
        ) {

          const sourceProduct =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(
              transformation.source_product_id
            )


          if (sourceProduct) {

            db.prepare(`
              UPDATE products

              SET stock =
                stock + @quantity

              WHERE id = @productId
            `).run({

              quantity:
                transformation.source_quantity,

              productId:
                transformation.source_product_id,

            })

          }

        }


        db.prepare(`
          DELETE FROM inventory_movements
          WHERE reference_id = ?
        `).run(id)


        db.prepare(`
          DELETE FROM transformation_outputs
          WHERE transformation_id = ?
        `).run(id)


        const deleteResult =
          db.prepare(`
            DELETE FROM transformations
            WHERE id = ?
          `).run(id)


        if (
          deleteResult.changes === 0
        ) {

          throw new Error(
            'No se pudo eliminar la transformación.'
          )

        }


        return transformation

      })()


    res.json({

      message:
        'Transformación eliminada correctamente.',

      transformation: {

        id:
          result.id,

        sourceDescription:
          result.source_description,

      },

    })

  } catch (error) {

    console.error(
      'Error eliminando transformación:',
      error
    )

    res.status(400).json({

      error:
        error.message ||
        'No se pudo eliminar la transformación.'

    })

  }

})


// ========================================
// INVENTARIO
// ========================================


// ========================================
// OBTENER MOVIMIENTOS
// ========================================

app.get(
  '/api/inventory/movements',
  (req, res) => {

    try {

      const movements =
        db.prepare(`
          SELECT

            inventory_movements.*,

            products.name
              AS product_name,

            products.unit
              AS product_unit

          FROM inventory_movements

          INNER JOIN products
            ON products.id =
               inventory_movements.product_id

          ORDER BY
            inventory_movements.id DESC
        `).all()


      res.json(movements)

    } catch (error) {

      console.error(
        'Error obteniendo movimientos:',
        error
      )

      res.status(500).json({

        error:
          'No se pudieron obtener los movimientos.'

      })

    }

  }
)


// ========================================
// RESUMEN INVENTARIO
// ========================================

app.get(
  '/api/inventory/summary',
  (req, res) => {

    try {

      const summary =
        db.prepare(`
          SELECT

            COUNT(*) AS products,

            COALESCE(
              SUM(stock),
              0
            ) AS units,

            COALESCE(
              SUM(
                CASE

                  WHEN stock <= minimum_stock
                  THEN 1

                  ELSE 0

                END
              ),
              0
            ) AS low_stock

          FROM products
        `).get()


      res.json({

        products:
          Number(summary.products) || 0,

        units:
          Number(summary.units) || 0,

        low_stock:
          Number(summary.low_stock) || 0,

      })

    } catch (error) {

      console.error(
        'Error obteniendo resumen:',
        error
      )

      res.status(500).json({

        error:
          error.message ||
          'No se pudo obtener el resumen del inventario.'

      })

    }

  }
)


// ========================================
// REGISTRAR MOVIMIENTO MANUAL
// ========================================

app.post(
  '/api/inventory/movements',
  (req, res) => {

    const {

      productId,
      type,
      quantity,
      unitCost,
      description,

    } = req.body


    const id =
      Number(productId)

    const qty =
      Number(quantity)

    const cost =
      Number(unitCost || 0)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return res.status(400).json({

        error:
          'Debes indicar un producto válido.'

      })

    }


    if (
      type !== 'entrada' &&
      type !== 'salida'
    ) {

      return res.status(400).json({

        error:
          'El tipo de movimiento debe ser entrada o salida.'

      })

    }


    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {

      return res.status(400).json({

        error:
          'La cantidad debe ser mayor a cero.'

      })

    }


    if (
      !Number.isFinite(cost) ||
      cost < 0
    ) {

      return res.status(400).json({

        error:
          'El costo unitario no es válido.'

      })

    }


    try {

      const result =
        db.transaction(() => {

          const product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(id)


          if (!product) {

            throw new Error(
              'Producto no encontrado.'
            )

          }


          if (
            type === 'salida' &&
            Number(product.stock) < qty
          ) {

            throw new Error(
              `Stock insuficiente. Disponible: ${product.stock}.`
            )

          }


          const newStock =
            type === 'entrada'
              ? Number(product.stock) + qty
              : Number(product.stock) - qty


          db.prepare(`
            UPDATE products

            SET stock = @stock

            WHERE id = @productId
          `).run({

            stock:
              newStock,

            productId:
              id,

          })


          const movement =
            db.prepare(`
              INSERT INTO inventory_movements
              (
                product_id,
                type,
                quantity,
                unit_cost,
                description
              )

              VALUES
              (
                @productId,
                @type,
                @quantity,
                @unitCost,
                @description
              )
            `).run({

              productId:
                id,

              type,

              quantity:
                qty,

              unitCost:
                cost,

              description:
                description ||
                'Movimiento manual',

            })


          return {

            movementId:
              Number(
                movement.lastInsertRowid
              ),

            newStock,

          }

        })()


      res.status(201).json({

        message:
          'Movimiento registrado correctamente.',

        movementId:
          result.movementId,

        newStock:
          result.newStock,

      })

    } catch (error) {

      console.error(
        'Error registrando movimiento:',
        error
      )

      res.status(400).json({

        error:
          error.message ||
          'No se pudo registrar el movimiento.'

      })

    }

  }
)


// ========================================
// RUTA DE DIAGNÓSTICO
// ========================================

app.get(
  '/api/inventory/test',
  (req, res) => {

    res.json({

      ok:
        true,

      message:
        'La sección de inventario está funcionando.',

      route:
        '/api/inventory/test',

    })

  }
)


// ========================================
// VENTAS
// ========================================


// ========================================
// REGISTRAR VENTA
// ========================================

app.post('/api/sales', (req, res) => {

  const {

    items,

    subtotal,
    shippingCost,
    total,
    payment,
    change,

    paymentMethod,
    notes,

  } = req.body


  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    return res.status(400).json({

      error:
        'Debes agregar al menos un producto a la venta.'

    })

  }


  const sentSubtotal =
    Number(subtotal)

  const sentShipping =
    Number(shippingCost || 0)

  const sentTotal =
    Number(total)

  const sentPayment =
    Number(payment)

  const sentChange =
    Number(change)


  if (
    !Number.isFinite(sentSubtotal) ||
    sentSubtotal < 0
  ) {

    return res.status(400).json({

      error:
        'El subtotal no es válido.'

    })

  }


  if (
    !Number.isFinite(sentShipping) ||
    sentShipping < 0
  ) {

    return res.status(400).json({

      error:
        'El costo de envío no es válido.'

    })

  }


  if (
    !Number.isFinite(sentTotal) ||
    sentTotal < 0
  ) {

    return res.status(400).json({

      error:
        'El total no es válido.'

    })

  }


  if (
    !Number.isFinite(sentPayment) ||
    sentPayment < 0
  ) {

    return res.status(400).json({

      error:
        'El pago recibido no es válido.'

    })

  }


  if (
    sentPayment < sentTotal
  ) {

    return res.status(400).json({

      error:
        'El pago recibido es insuficiente.'

    })

  }


  const cleanPaymentMethod =
    String(
      paymentMethod ||
      'Efectivo'
    ).trim() ||
    'Efectivo'


  try {

    const result =
      db.transaction(() => {

        // ==================================
        // VALIDAR PRODUCTOS
        // ==================================

        const preparedItems = []

        let calculatedSubtotal = 0

        let calculatedCost = 0


        for (
          const item
          of items
        ) {

          const productId =
            Number(item.productId)

          const quantity =
            Number(item.quantity)

          const unitPrice =
            Number(item.unitPrice)

          const sentUnitCost =
            Number(item.unitCost)


          if (
            !Number.isInteger(productId) ||
            productId <= 0
          ) {

            throw new Error(
              'Uno de los productos de la venta no es válido.'
            )

          }


          if (
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {

            throw new Error(
              'La cantidad de un producto debe ser un entero mayor a cero.'
            )

          }


          if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {

            throw new Error(
              'El precio de venta de un producto no es válido.'
            )

          }


          const product =
            db.prepare(`
              SELECT *
              FROM products
              WHERE id = ?
            `).get(productId)


          if (!product) {

            throw new Error(
              `El producto con ID ${productId} no existe.`
            )

          }


          if (
            Number(product.stock) <
            quantity
          ) {

            throw new Error(
              `Stock insuficiente para "${product.name}". Disponible: ${product.stock} ${product.unit}.`
            )

          }


          // El costo real utilizado
          // para utilidad viene del producto
          // almacenado en la base de datos.
          const realUnitCost =
            Number(product.cost || 0)


          const lineSubtotal =
            unitPrice *
            quantity


          const lineCost =
            realUnitCost *
            quantity


          calculatedSubtotal +=
            lineSubtotal


          calculatedCost +=
            lineCost


          preparedItems.push({

            product,

            productId,

            quantity,

            unitPrice,

            unitCost:
              realUnitCost,

            subtotal:
              lineSubtotal,

            costTotal:
              lineCost,

          })

        }


        calculatedSubtotal =
          Number(
            calculatedSubtotal.toFixed(2)
          )


        calculatedCost =
          Number(
            calculatedCost.toFixed(2)
          )


        const calculatedTotal =
          Number(
            (
              calculatedSubtotal +
              sentShipping
            ).toFixed(2)
          )


        // ==================================
        // VALIDAR TOTALES ENVIADOS
        // ==================================

        if (
          Math.abs(
            sentSubtotal -
            calculatedSubtotal
          ) > 0.01
        ) {

          throw new Error(
            `El subtotal no coincide. Esperado: ${calculatedSubtotal.toFixed(2)}.`
          )

        }


        if (
          Math.abs(
            sentTotal -
            calculatedTotal
          ) > 0.01
        ) {

          throw new Error(
            `El total no coincide. Esperado: ${calculatedTotal.toFixed(2)}.`
          )

        }


        const calculatedChange =
          Number(
            (
              sentPayment -
              calculatedTotal
            ).toFixed(2)
          )


        if (
          Math.abs(
            sentChange -
            calculatedChange
          ) > 0.01
        ) {

          throw new Error(
            `El cambio no coincide. Esperado: ${calculatedChange.toFixed(2)}.`
          )

        }


        // ==================================
        // CREAR VENTA
        // ==================================

        const saleResult =
          db.prepare(`
            INSERT INTO sales
            (
              subtotal,
              shipping_cost,
              total,
              payment,
              change,
              payment_method,
              notes
            )

            VALUES
            (
              @subtotal,
              @shippingCost,
              @total,
              @payment,
              @change,
              @paymentMethod,
              @notes
            )
          `).run({

            subtotal:
              calculatedSubtotal,

            shippingCost:
              sentShipping,

            total:
              calculatedTotal,

            payment:
              sentPayment,

            change:
              calculatedChange,

            paymentMethod:
              cleanPaymentMethod,

            notes:
              notes
                ? String(notes).trim()
                : null,

          })


        const saleId =
          Number(
            saleResult.lastInsertRowid
          )


        // ==================================
        // INSERTAR DETALLES
        // ==================================

        for (
          const item
          of preparedItems
        ) {

          db.prepare(`
            INSERT INTO sale_items
            (
              sale_id,
              product_id,
              quantity,
              unit_price,
              unit_cost,
              subtotal,
              cost_total
            )

            VALUES
            (
              @saleId,
              @productId,
              @quantity,
              @unitPrice,
              @unitCost,
              @subtotal,
              @costTotal
            )
          `).run({

            saleId,

            productId:
              item.productId,

            quantity:
              item.quantity,

            unitPrice:
              item.unitPrice,

            unitCost:
              item.unitCost,

            subtotal:
              item.subtotal,

            costTotal:
              item.costTotal,

          })


          // ==================================
          // DESCONTAR INVENTARIO
          // ==================================

          const update =
            db.prepare(`
              UPDATE products

              SET stock =
                stock - @quantity

              WHERE id = @productId
                AND stock >= @quantity
            `).run({

              quantity:
                item.quantity,

              productId:
                item.productId,

            })


          if (
            update.changes === 0
          ) {

            throw new Error(
              `No se pudo descontar el inventario de "${item.product.name}".`
            )

          }


          // ==================================
          // MOVIMIENTO DE INVENTARIO
          // ==================================

          db.prepare(`
            INSERT INTO inventory_movements
            (
              product_id,
              type,
              quantity,
              unit_cost,
              reference_id,
              description
            )

            VALUES
            (
              @productId,
              'salida',
              @quantity,
              @unitCost,
              @referenceId,
              @description
            )
          `).run({

            productId:
              item.productId,

            quantity:
              item.quantity,

            unitCost:
              item.unitCost,

            referenceId:
              saleId,

            description:
              `Salida por venta #${saleId}`,

          })

        }


        const sale =
          db.prepare(`
            SELECT *
            FROM sales
            WHERE id = ?
          `).get(saleId)


        return {

          sale,

          calculatedCost,

          grossProfit:
            Number(
              (
                calculatedSubtotal -
                calculatedCost
              ).toFixed(2)
            ),

        }

      })()


    res.status(201).json({

      message:
        'Venta registrada correctamente.',

      sale:
        result.sale,

      cost:
        result.calculatedCost,

      grossProfit:
        result.grossProfit,

    })

  } catch (error) {

    console.error(
      'Error registrando venta:',
      error
    )

    res.status(400).json({

      error:
        error.message ||
        'No se pudo registrar la venta.'

    })

  }

})


// ========================================
// OBTENER VENTAS
// ========================================

app.get('/api/sales', (req, res) => {

  try {

    const sales =
      db.prepare(`
        SELECT

          sales.*,

          COALESCE(
            SUM(
              sale_items.quantity
            ),
            0
          ) AS total_items,

          COALESCE(
            SUM(
              sale_items.cost_total
            ),
            0
          ) AS product_cost,

          COALESCE(
            SUM(
              sale_items.subtotal
            ),
            0
          ) AS items_subtotal

        FROM sales

        LEFT JOIN sale_items
          ON sale_items.sale_id =
             sales.id

        GROUP BY sales.id

        ORDER BY
          sales.id DESC
      `).all()


    const result =
      sales.map(sale => ({

        ...sale,

        total_items:
          Number(
            sale.total_items
          ) || 0,

        product_cost:
          Number(
            sale.product_cost
          ) || 0,

        gross_profit:
          Number(
            (
              Number(sale.subtotal || 0) -
              Number(sale.product_cost || 0)
            ).toFixed(2)
          ),

      }))


    res.json(result)

  } catch (error) {

    console.error(
      'Error obteniendo ventas:',
      error
    )

    res.status(500).json({

      error:
        'No se pudieron obtener las ventas.'

    })

  }

})


// ========================================
// DETALLE DE VENTA
// ========================================

app.get('/api/sales/:id', (req, res) => {

  try {

    const id =
      Number(req.params.id)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return res.status(400).json({

        error:
          'ID de venta no válido.'

      })

    }


    const sale =
      db.prepare(`
        SELECT *
        FROM sales
        WHERE id = ?
      `).get(id)


    if (!sale) {

      return res.status(404).json({

        error:
          'Venta no encontrada.'

      })

    }


    const items =
      db.prepare(`
        SELECT

          sale_items.*,

          products.name
            AS product_name,

          products.category
            AS product_category,

          products.unit
            AS product_unit

        FROM sale_items

        LEFT JOIN products
          ON products.id =
             sale_items.product_id

        WHERE sale_items.sale_id = ?

        ORDER BY sale_items.id ASC
      `).all(id)


    const productCost =
      items.reduce(

        (sum, item) =>
          sum +
          Number(item.cost_total || 0),

        0

      )


    res.json({

      sale,

      items,

      productCost,

      grossProfit:
        Number(
          (
            Number(sale.subtotal || 0) -
            productCost
          ).toFixed(2)
        ),

    })

  } catch (error) {

    console.error(
      'Error obteniendo detalle de venta:',
      error
    )

    res.status(500).json({

      error:
        'No se pudo obtener el detalle de la venta.'

    })

  }

})


// ========================================
// GASTOS
// ========================================


// ========================================
// OBTENER GASTOS
// ========================================

app.get('/api/expenses', (req, res) => {

  try {

    const expenses =
      db.prepare(`
        SELECT *

        FROM expenses

        ORDER BY
          expense_date DESC,
          id DESC
      `).all()


    res.json(expenses)

  } catch (error) {

    console.error(
      'Error obteniendo gastos:',
      error
    )

    res.status(500).json({

      error:
        'No se pudieron obtener los gastos.'

    })

  }

})


// ========================================
// REGISTRAR GASTO
// ========================================

app.post('/api/expenses', (req, res) => {

  const {

    description,
    category,
    amount,
    paymentMethod,
    expenseDate,
    notes,

  } = req.body


  const cleanDescription =
    String(
      description || ''
    ).trim()


  const cleanCategory =
    String(
      category || 'Operación'
    ).trim() ||
    'Operación'


  const cleanPaymentMethod =
    String(
      paymentMethod || 'Efectivo'
    ).trim() ||
    'Efectivo'


  const numericAmount =
    Number(amount)


  const cleanDate =
    String(
      expenseDate || ''
    ).trim()


  const cleanNotes =
    String(
      notes || ''
    ).trim()


  if (!cleanDescription) {

    return res.status(400).json({

      error:
        'La descripción del gasto es obligatoria.'

    })

  }


  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {

    return res.status(400).json({

      error:
        'El importe debe ser mayor a cero.'

    })

  }


  if (!cleanDate) {

    return res.status(400).json({

      error:
        'La fecha del gasto es obligatoria.'

    })

  }


  try {

    const result =
      db.prepare(`
        INSERT INTO expenses
        (
          description,
          category,
          amount,
          payment_method,
          expense_date,
          notes
        )

        VALUES
        (
          @description,
          @category,
          @amount,
          @paymentMethod,
          @expenseDate,
          @notes
        )
      `).run({

        description:
          cleanDescription,

        category:
          cleanCategory,

        amount:
          numericAmount,

        paymentMethod:
          cleanPaymentMethod,

        expenseDate:
          cleanDate,

        notes:
          cleanNotes ||
          null,

      })


    const expense =
      db.prepare(`
        SELECT *

        FROM expenses

        WHERE id = ?
      `).get(
        Number(
          result.lastInsertRowid
        )
      )


    res.status(201).json({

      message:
        'Gasto registrado correctamente.',

      expense,

    })

  } catch (error) {

    console.error(
      'Error registrando gasto:',
      error
    )

    res.status(500).json({

      error:
        error.message ||
        'No se pudo registrar el gasto.'

    })

  }

})


// ========================================
// ELIMINAR GASTO
// ========================================

app.delete(
  '/api/expenses/:id',
  (req, res) => {

    const id =
      Number(
        req.params.id
      )


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return res.status(400).json({

        error:
          'ID de gasto no válido.'

      })

    }


    try {

      const expense =
        db.prepare(`
          SELECT *

          FROM expenses

          WHERE id = ?
        `).get(id)


      if (!expense) {

        return res.status(404).json({

          error:
            'Gasto no encontrado.'

        })

      }


      const result =
        db.prepare(`
          DELETE FROM expenses

          WHERE id = ?
        `).run(id)


      if (
        result.changes === 0
      ) {

        throw new Error(
          'No se pudo eliminar el gasto.'
        )

      }


      res.json({

        message:
          'Gasto eliminado correctamente.',

        expense: {

          id:
            expense.id,

          description:
            expense.description,

          amount:
            expense.amount,

        },

      })

    } catch (error) {

      console.error(
        'Error eliminando gasto:',
        error
      )

      res.status(400).json({

        error:
          error.message ||
          'No se pudo eliminar el gasto.'

      })

    }

  }
)


// ========================================
// RESUMEN DE GASTOS
// ========================================

app.get(
  '/api/expenses/summary',
  (req, res) => {

    try {

      const summary =
        db.prepare(`
          SELECT

            COUNT(*) AS total_expenses,

            COALESCE(
              SUM(amount),
              0
            ) AS total_amount

          FROM expenses
        `).get()


      res.json({

        totalExpenses:
          Number(
            summary.total_expenses
          ) || 0,

        totalAmount:
          Number(
            summary.total_amount
          ) || 0,

      })

    } catch (error) {

      console.error(
        'Error obteniendo resumen de gastos:',
        error
      )

      res.status(500).json({

        error:
          'No se pudo obtener el resumen de gastos.'

      })

    }

  }
)


// ========================================
// CORTES
// ========================================


// ========================================
// FUNCIÓN PARA NORMALIZAR FECHA
// ========================================

function normalizeDate(value) {

  const text =
    String(
      value || ''
    ).trim()


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {

    return null

  }


  return text

}


// ========================================
// OBTENER RESUMEN DE CORTE
// ========================================
//
// GET:
//
// /api/cortes/resumen?date=2026-08-21
//
// Si no se manda fecha,
// utiliza la fecha actual local.
//
// ========================================

app.get(
  '/api/cortes/resumen',
  (req, res) => {

    try {

      let date =
        normalizeDate(
          req.query.date
        )


      if (!date) {

        date =
          db.prepare(`
            SELECT
              DATE('now', 'localtime')
              AS today
          `).get().today

      }


      // ==================================
      // VENTAS DEL DÍA
      // ==================================

      const salesSummary =
        db.prepare(`
          SELECT

            COUNT(*) AS sales_count,

            COALESCE(
              SUM(subtotal),
              0
            ) AS sales_subtotal,

            COALESCE(
              SUM(shipping_cost),
              0
            ) AS shipping_total,

            COALESCE(
              SUM(total),
              0
            ) AS sales_total,

            COALESCE(
              SUM(payment),
              0
            ) AS payment_total,

            COALESCE(
              SUM(change),
              0
            ) AS change_total

          FROM sales

          WHERE DATE(
            sale_date,
            'localtime'
          ) = ?
        `).get(date)


      // ==================================
      // COSTO DE PRODUCTOS VENDIDOS
      // ==================================

      const costSummary =
        db.prepare(`
          SELECT

            COALESCE(
              SUM(
                sale_items.cost_total
              ),
              0
            ) AS product_cost

          FROM sale_items

          INNER JOIN sales
            ON sales.id =
               sale_items.sale_id

          WHERE DATE(
            sales.sale_date,
            'localtime'
          ) = ?
        `).get(date)


      // ==================================
      // GASTOS DEL DÍA
      // ==================================

      const expenseSummary =
        db.prepare(`
          SELECT

            COUNT(*) AS expense_count,

            COALESCE(
              SUM(amount),
              0
            ) AS expenses_total

          FROM expenses

          WHERE DATE(
            expense_date
          ) = ?
        `).get(date)


      // ==================================
      // VENTAS POR MÉTODO DE PAGO
      // ==================================

      const paymentMethods =
        db.prepare(`
          SELECT

            payment_method,

            COUNT(*) AS count,

            COALESCE(
              SUM(total),
              0
            ) AS total

          FROM sales

          WHERE DATE(
            sale_date,
            'localtime'
          ) = ?

          GROUP BY payment_method

          ORDER BY total DESC
        `).all(date)


      // ==================================
      // UTILIDADES
      // ==================================

      const salesSubtotal =
        Number(
          salesSummary.sales_subtotal
        ) || 0


      const shippingTotal =
        Number(
          salesSummary.shipping_total
        ) || 0


      const salesTotal =
        Number(
          salesSummary.sales_total
        ) || 0


      const productCost =
        Number(
          costSummary.product_cost
        ) || 0


      const expensesTotal =
        Number(
          expenseSummary.expenses_total
        ) || 0


      const grossProfit =
        Number(
          (
            salesSubtotal -
            productCost
          ).toFixed(2)
        )


      const netProfit =
        Number(
          (
            grossProfit +
            shippingTotal -
            expensesTotal
          ).toFixed(2)
        )


      // El efectivo esperado se calcula
      // únicamente con ventas en efectivo.
      const cashSummary =
        db.prepare(`
          SELECT

            COALESCE(
              SUM(total),
              0
            ) AS cash_sales

          FROM sales

          WHERE DATE(
            sale_date,
            'localtime'
          ) = ?

          AND LOWER(
            TRIM(payment_method)
          ) = 'efectivo'
        `).get(date)


      const cashExpected =
        Number(
          cashSummary.cash_sales
        ) || 0


      res.json({

        date,

        sales: {

          count:
            Number(
              salesSummary.sales_count
            ) || 0,

          subtotal:
            Number(
              salesSubtotal.toFixed(2)
            ),

          shipping:
            Number(
              shippingTotal.toFixed(2)
            ),

          total:
            Number(
              salesTotal.toFixed(2)
            ),

          payment:
            Number(
              salesSummary.payment_total || 0
            ),

          change:
            Number(
              salesSummary.change_total || 0
            ),

        },

        inventory: {

          productCost:
            Number(
              productCost.toFixed(2)
            ),

        },

        expenses: {

          count:
            Number(
              expenseSummary.expense_count
            ) || 0,

          total:
            Number(
              expensesTotal.toFixed(2)
            ),

        },

        grossProfit,

        netProfit,

        cashExpected:
          Number(
            cashExpected.toFixed(2)
          ),

        paymentMethods:

          paymentMethods.map(
            method => ({

              paymentMethod:
                method.payment_method,

              count:
                Number(
                  method.count
                ) || 0,

              total:
                Number(
                  method.total || 0
                ),

            })
          ),

      })

    } catch (error) {

      console.error(
        'Error obteniendo resumen de corte:',
        error
      )

      res.status(500).json({

        error:
          error.message ||
          'No se pudo obtener el resumen del corte.'

      })

    }

  }
)


// ========================================
// OBTENER VENTAS DEL CORTE
// ========================================

app.get(
  '/api/cortes/ventas',
  (req, res) => {

    try {

      let date =
        normalizeDate(
          req.query.date
        )


      if (!date) {

        date =
          db.prepare(`
            SELECT
              DATE('now', 'localtime')
              AS today
          `).get().today

      }


      const sales =
        db.prepare(`
          SELECT

            sales.*,

            COALESCE(
              SUM(
                sale_items.quantity
              ),
              0
            ) AS total_items,

            COALESCE(
              SUM(
                sale_items.cost_total
              ),
              0
            ) AS product_cost

          FROM sales

          LEFT JOIN sale_items
            ON sale_items.sale_id =
               sales.id

          WHERE DATE(
            sales.sale_date,
            'localtime'
          ) = ?

          GROUP BY sales.id

          ORDER BY
            sales.id DESC
        `).all(date)


      res.json(

        sales.map(sale => ({

          ...sale,

          total_items:
            Number(
              sale.total_items
            ) || 0,

          product_cost:
            Number(
              sale.product_cost
            ) || 0,

          gross_profit:
            Number(
              (
                Number(sale.subtotal || 0) -
                Number(sale.product_cost || 0)
              ).toFixed(2)
            ),

        }))

      )

    } catch (error) {

      console.error(
        'Error obteniendo ventas del corte:',
        error
      )

      res.status(500).json({

        error:
          'No se pudieron obtener las ventas del corte.'

      })

    }

  }
)


// ========================================
// OBTENER GASTOS DEL CORTE
// ========================================

app.get(
  '/api/cortes/gastos',
  (req, res) => {

    try {

      let date =
        normalizeDate(
          req.query.date
        )


      if (!date) {

        date =
          db.prepare(`
            SELECT
              DATE('now', 'localtime')
              AS today
          `).get().today

      }


      const expenses =
        db.prepare(`
          SELECT *

          FROM expenses

          WHERE DATE(
            expense_date
          ) = ?

          ORDER BY
            expense_date DESC,
            id DESC
        `).all(date)


      res.json(expenses)

    } catch (error) {

      console.error(
        'Error obteniendo gastos del corte:',
        error
      )

      res.status(500).json({

        error:
          'No se pudieron obtener los gastos del corte.'

      })

    }

  }
)


// ========================================
// CREAR CORTE
// ========================================
//
// POST /api/cortes
//
// Body:
//
// {
//   "date": "2026-08-21",
//   "cashCounted": 2500,
//   "notes": "Corte del día"
// }
//
// ========================================

app.post(
  '/api/cortes',
  (req, res) => {

    const {

      date,
      cashCounted,
      notes,

    } = req.body


    const cleanDate =
      normalizeDate(date)


    const counted =
      Number(cashCounted)


    if (!cleanDate) {

      return res.status(400).json({

        error:
          'La fecha del corte no es válida. Usa YYYY-MM-DD.'

      })

    }


    if (
      !Number.isFinite(counted) ||
      counted < 0
    ) {

      return res.status(400).json({

        error:
          'El efectivo contado no es válido.'

      })

    }


    try {

      const result =
        db.transaction(() => {

          // ==================================
          // EVITAR CORTE DUPLICADO
          // ==================================

          const existingCut =
            db.prepare(`
              SELECT *
              FROM cash_cuts
              WHERE cut_date = ?
              LIMIT 1
            `).get(cleanDate)


          if (existingCut) {

            throw new Error(
              `Ya existe un corte registrado para el día ${cleanDate}.`
            )

          }


          // ==================================
          // VENTAS
          // ==================================

          const salesSummary =
            db.prepare(`
              SELECT

                COUNT(*) AS sales_count,

                COALESCE(
                  SUM(subtotal),
                  0
                ) AS sales_subtotal,

                COALESCE(
                  SUM(shipping_cost),
                  0
                ) AS shipping_total,

                COALESCE(
                  SUM(total),
                  0
                ) AS sales_total

              FROM sales

              WHERE DATE(
                sale_date,
                'localtime'
              ) = ?
            `).get(cleanDate)


          // ==================================
          // COSTO
          // ==================================

          const costSummary =
            db.prepare(`
              SELECT

                COALESCE(
                  SUM(
                    sale_items.cost_total
                  ),
                  0
                ) AS product_cost

              FROM sale_items

              INNER JOIN sales
                ON sales.id =
                   sale_items.sale_id

              WHERE DATE(
                sales.sale_date,
                'localtime'
              ) = ?
            `).get(cleanDate)


          // ==================================
          // GASTOS
          // ==================================

          const expenseSummary =
            db.prepare(`
              SELECT

                COALESCE(
                  SUM(amount),
                  0
                ) AS expenses_total

              FROM expenses

              WHERE DATE(
                expense_date
              ) = ?
            `).get(cleanDate)


          // ==================================
          // EFECTIVO
          // ==================================

          const cashSummary =
            db.prepare(`
              SELECT

                COALESCE(
                  SUM(total),
                  0
                ) AS cash_expected

              FROM sales

              WHERE DATE(
                sale_date,
                'localtime'
              ) = ?

              AND LOWER(
                TRIM(payment_method)
              ) = 'efectivo'
            `).get(cleanDate)


          const salesCount =
            Number(
              salesSummary.sales_count
            ) || 0


          const salesSubtotal =
            Number(
              salesSummary.sales_subtotal
            ) || 0


          const shippingTotal =
            Number(
              salesSummary.shipping_total
            ) || 0


          const salesTotal =
            Number(
              salesSummary.sales_total
            ) || 0


          const productCost =
            Number(
              costSummary.product_cost
            ) || 0


          const expensesTotal =
            Number(
              expenseSummary.expenses_total
            ) || 0


          const grossProfit =
            Number(
              (
                salesSubtotal -
                productCost
              ).toFixed(2)
            )


          const netProfit =
            Number(
              (
                grossProfit +
                shippingTotal -
                expensesTotal
              ).toFixed(2)
            )


          const cashExpected =
            Number(
              cashSummary.cash_expected
            ) || 0


          const difference =
            Number(
              (
                counted -
                cashExpected
              ).toFixed(2)
            )


          // ==================================
          // CREAR CORTE
          // ==================================

          const cutResult =
            db.prepare(`
              INSERT INTO cash_cuts
              (
                cut_date,
                period_start,
                period_end,
                sales_count,
                sales_total,
                sales_subtotal,
                shipping_total,
                product_cost,
                gross_profit,
                expenses_total,
                net_profit,
                cash_expected,
                cash_counted,
                difference,
                notes
              )

              VALUES
              (
                @cutDate,
                @periodStart,
                @periodEnd,
                @salesCount,
                @salesTotal,
                @salesSubtotal,
                @shippingTotal,
                @productCost,
                @grossProfit,
                @expensesTotal,
                @netProfit,
                @cashExpected,
                @cashCounted,
                @difference,
                @notes
              )
            `).run({

              cutDate:
                cleanDate,

              periodStart:
                `${cleanDate} 00:00:00`,

              periodEnd:
                `${cleanDate} 23:59:59`,

              salesCount,

              salesTotal:
                Number(
                  salesTotal.toFixed(2)
                ),

              salesSubtotal:
                Number(
                  salesSubtotal.toFixed(2)
                ),

              shippingTotal:
                Number(
                  shippingTotal.toFixed(2)
                ),

              productCost:
                Number(
                  productCost.toFixed(2)
                ),

              grossProfit,

              expensesTotal:
                Number(
                  expensesTotal.toFixed(2)
                ),

              netProfit,

              cashExpected:
                Number(
                  cashExpected.toFixed(2)
                ),

              cashCounted:
                Number(
                  counted.toFixed(2)
                ),

              difference,

              notes:
                notes
                  ? String(notes).trim()
                  : null,

            })


          const cutId =
            Number(
              cutResult.lastInsertRowid
            )


          const cut =
            db.prepare(`
              SELECT *
              FROM cash_cuts
              WHERE id = ?
            `).get(cutId)


          return cut

        })()


      res.status(201).json({

        message:
          'Corte registrado correctamente.',

        cut:
          result,

      })

    } catch (error) {

      console.error(
        'Error registrando corte:',
        error
      )

      res.status(400).json({

        error:
          error.message ||
          'No se pudo registrar el corte.'

      })

    }

  }
)


// ========================================
// OBTENER CORTES
// ========================================

app.get(
  '/api/cortes',
  (req, res) => {

    try {

      const cuts =
        db.prepare(`
          SELECT *

          FROM cash_cuts

          ORDER BY
            cut_date DESC,
            id DESC
        `).all()


      res.json(cuts)

    } catch (error) {

      console.error(
        'Error obteniendo cortes:',
        error
      )

      res.status(500).json({

        error:
          'No se pudieron obtener los cortes.'

      })

    }

  }
)


// ========================================
// OBTENER DETALLE DE CORTE
// ========================================

app.get(
  '/api/cortes/:id',
  (req, res) => {

    try {

      const id =
        Number(req.params.id)


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({

          error:
            'ID de corte no válido.'

        })

      }


      const cut =
        db.prepare(`
          SELECT *
          FROM cash_cuts
          WHERE id = ?
        `).get(id)


      if (!cut) {

        return res.status(404).json({

          error:
            'Corte no encontrado.'

        })

      }


      const sales =
        db.prepare(`
          SELECT

            sales.*,

            COALESCE(
              SUM(
                sale_items.quantity
              ),
              0
            ) AS total_items,

            COALESCE(
              SUM(
                sale_items.cost_total
              ),
              0
            ) AS product_cost

          FROM sales

          LEFT JOIN sale_items
            ON sale_items.sale_id =
               sales.id

          WHERE DATE(
            sales.sale_date,
            'localtime'
          ) = ?

          GROUP BY sales.id

          ORDER BY sales.id DESC
        `).all(
          cut.cut_date
        )


      const expenses =
        db.prepare(`
          SELECT *

          FROM expenses

          WHERE DATE(
            expense_date
          ) = ?

          ORDER BY
            expense_date DESC,
            id DESC
        `).all(
          cut.cut_date
        )


      const paymentMethods =
        db.prepare(`
          SELECT

            payment_method,

            COUNT(*) AS count,

            COALESCE(
              SUM(total),
              0
            ) AS total

          FROM sales

          WHERE DATE(
            sale_date,
            'localtime'
          ) = ?

          GROUP BY payment_method

          ORDER BY total DESC
        `).all(
          cut.cut_date
        )


      res.json({

        cut,

        sales,

        expenses,

        paymentMethods,

      })

    } catch (error) {

      console.error(
        'Error obteniendo detalle del corte:',
        error
      )

      res.status(500).json({

        error:
          'No se pudo obtener el detalle del corte.'

      })

    }

  }
)


// ========================================
// MANEJO DE RUTA NO ENCONTRADA
// ========================================

app.use((req, res) => {

  res.status(404).json({

    error:
      'Ruta no encontrada.',

    route:
      req.originalUrl,

  })

})


// ========================================
// MANEJO GLOBAL DE ERRORES
// ========================================

app.use((error, req, res, next) => {

  console.error(
    'Error global del servidor:',
    error
  )


  res.status(500).json({

    error:
      error.message ||
      'Error interno del servidor.'

  })

})


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(
  PORT,
  () => {

    console.log(
      `Servidor Ezra funcionando en http://localhost:${PORT}`
    )

    console.log(
      `API: http://localhost:${PORT}/api`
    )

    console.log(
      `Productos: http://localhost:${PORT}/api/products`
    )

    console.log(
      `Compras: http://localhost:${PORT}/api/purchases`
    )

    console.log(
      `Ventas: http://localhost:${PORT}/api/sales`
    )

    console.log(
      `Transformaciones: http://localhost:${PORT}/api/transformations`
    )

    console.log(
      `Inventario: http://localhost:${PORT}/api/inventory/summary`
    )

    console.log(
      `Gastos: http://localhost:${PORT}/api/expenses`
    )

    console.log(
      `Cortes: http://localhost:${PORT}/api/cortes`
    )

  }
)