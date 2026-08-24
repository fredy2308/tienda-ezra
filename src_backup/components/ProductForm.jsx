import { useState } from 'react'


function ProductForm({ onSave, onCancel }) {

const [form, setForm] = useState({
  name: '',
  category: 'Plantas',
  cost: '',
  price: '',
  stock: '',
  minimumStock: '3',
  unit: 'pieza',
})


  function handleChange(event) {

    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value,
    })
  }


  function handleSubmit(event) {

    event.preventDefault()


    if (!form.name.trim()) {
      alert('Escribe el nombre del producto.')
      return
    }


    if (!form.cost || Number(form.cost) < 0) {
      alert('Ingresa un costo válido.')
      return
    }


    if (!form.price || Number(form.price) < 0) {
      alert('Ingresa un precio válido.')
      return
    }


    if (
      form.stock === '' ||
      Number(form.stock) < 0
    ) {
      alert('Ingresa una cantidad válida.')
      return
    }


onSave({

  ...form,

  cost: Number(form.cost),

  price: Number(form.price),

  stock: Number(form.stock),

  minimumStock:
    Number(form.minimumStock),

  unit: form.unit,

})

  }


  return (

    <div
      className="modal-background"
      onMouseDown={event => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel()
        }

      }}
    >

      <div className="product-modal">

        <div className="modal-header">

          <div>

            <h3>
              Nuevo producto
            </h3>

            <p>
              Registra un nuevo artículo para Ezra.
            </p>

          </div>


          <button
            className="close-button"
            onClick={onCancel}
          >
            ×
          </button>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>
              Nombre del producto
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Monstera deliciosa"
              autoFocus
            />

          </div>


          <div className="form-group">

            <label>
              Categoría
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >

              <option value="Plantas">
                🌿 Plantas
              </option>

              <option value="Macetas">
                🪴 Macetas
              </option>

              <option value="Decoración">
                🏺 Decoración
              </option>

              <option value="Sustratos">
                🌱 Sustratos
              </option>

              <option value="Accesorios">
                🧰 Accesorios
              </option>

            </select>

          </div>


          <div className="form-row">

            <div className="form-group">

              <label>
                Costo de adquisición
              </label>

              <input
                type="number"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />

            </div>


            <div className="form-group">

              <label>
                Precio de venta
              </label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />

            </div>

          </div>


          <div className="form-group">

            <label>
              Existencia inicial
            </label>

            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="0"
            />

          </div>
<div className="form-row">

  <div className="form-group">

    <label>
      Stock mínimo
    </label>

    <input
      type="number"
      name="minimumStock"
      value={form.minimumStock}
      onChange={handleChange}
      min="0"
      step="1"
      placeholder="3"
    />

  </div>


  <div className="form-group">

    <label>
      Unidad
    </label>

    <select
      name="unit"
      value={form.unit}
      onChange={handleChange}
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

      <option value="kit">
        Kit
      </option>

    </select>

  </div>

</div>

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="primary-button"
            >
              Guardar producto
            </button>

          </div>

        </form>

      </div>

    </div>

  )
}


export default ProductForm