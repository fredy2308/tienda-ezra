function ProductsTable({ products, onDelete }) {


  function formatCurrency(value) {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
      }
    ).format(value)

  }


  function getMargin(product) {

    return product.price - product.cost

  }


  return (

    <div className="products-table-container">

      <table className="products-table">

        <thead>

          <tr>

            <th>
              Producto
            </th>

            <th>
              Categoría
            </th>

            <th>
              Costo
            </th>

            <th>
              Precio venta
            </th>

            <th>
              Utilidad
            </th>

            <th>
              Existencia
            </th>

            <th>
              Acción
            </th>

          </tr>

        </thead>


        <tbody>

          {products.map(product => {

            const margin =
              getMargin(product)
              const marginPercentage =
  product.price > 0
    ? (margin / product.price) * 100
    : 0


            return (

              <tr key={product.id}>

                <td>

                  <strong>
                    {product.name}
                  </strong>

                </td>


                <td>
                  {product.category}
                </td>


                <td>
                  {formatCurrency(product.cost)}
                </td>


                <td>

                  <strong>
                    {formatCurrency(product.price)}
                  </strong>

                </td>


<td>

  <span className="margin-value">

    +{formatCurrency(margin)}

    <small
      style={{
        display: 'block',
        marginTop: '3px',
        color: '#98a19c',
        fontWeight: '400',
      }}
    >
      {marginPercentage.toFixed(1)}% margen
    </small>

  </span>

</td>


                <td>

                  <span
                    className={
                      product.stock <= 3
                        ? 'stock-low'
                        : 'stock-ok'
                    }
                  >
                    {product.stock}
                  </span>

                </td>


                <td>

                  <button
                    className="delete-button"
                    onClick={() =>
                      onDelete(product.id)
                    }
                  >
                    Eliminar
                  </button>

                </td>

              </tr>

            )

          })}

        </tbody>

      </table>

    </div>

  )
}


export default ProductsTable