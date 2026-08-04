/* ============================================================
    Grilla — hash espacial (spatial hash grid) para acelerar
    búsquedas de "quién está cerca de este punto" sin recorrer
    TODOS los enemigos en cada consulta.

    Se reconstruye una vez por frame (los enemigos se mueven),
    así las consultas quedan en O(1) amortizado en vez de O(n).
    ============================================================ */
class Grilla {
    constructor(tamCelda) {
        this.tamCelda = tamCelda;
        this.celdas = new Map(); // clave "cx,cy" -> array de objetos {x,y,...}
    }

    _clave(cx, cy) {
        return cx + ',' + cy;
    }

    _celdaDe(x, y) {
        return [Math.floor(x / this.tamCelda), Math.floor(y / this.tamCelda)];
    }

    limpiar() {
        this.celdas.clear();
    }

    insertar(obj) {
        const [cx, cy] = this._celdaDe(obj.x, obj.y);
        const clave = this._clave(cx, cy);
        let balde = this.celdas.get(clave);
        if (!balde) {
            balde = [];
            this.celdas.set(clave, balde);
        }
        balde.push(obj);
    }

    // Vacía la grilla y vuelve a insertar toda la lista. Se llama una vez por frame.
    reconstruir(lista) {
        this.limpiar();
        for (const obj of lista) this.insertar(obj);
    }

    // Objetos en las celdas que tocan el círculo (x, y, radio).
    // Puede traer alguno un poco más lejos (falso positivo cerca de una
    // esquina de celda) — quien consulte filtra por distancia real si la necesita exacta.
    consultarRadio(x, y, radio) {
        const resultado = [];
        const [cx0, cy0] = this._celdaDe(x - radio, y - radio);
        const [cx1, cy1] = this._celdaDe(x + radio, y + radio);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cy = cy0; cy <= cy1; cy++) {
                const balde = this.celdas.get(this._clave(cx, cy));
                if (balde) resultado.push(...balde);
            }
        }
        return resultado;
    }

    // Objeto más cercano a (x, y) dentro de radioMax, o null.
    // filtro es opcional: filtro(obj) => true/false (para excluir muertos, etc.)
    masCercano(x, y, radioMax, filtro) {
        let mejor = null;
        let mejorDist = radioMax;
        for (const obj of this.consultarRadio(x, y, radioMax)) {
            if (filtro && !filtro(obj)) continue;
            const d = Math.hypot(obj.x - x, obj.y - y);
            if (d < mejorDist) {
                mejorDist = d;
                mejor = obj;
            }
        }
        return mejor;
    }
}