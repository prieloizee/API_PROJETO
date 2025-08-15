const connect = require('../db/connect');

module.exports = class Estabelecimento {
  constructor({ id, placeId, nome, endereco, tipo, latitude, longitude, telefone, website }) {
    this.id = id;
    this.placeId = placeId;
    this.nome = nome;
    this.endereco = endereco;
    this.tipo = tipo;
    this.latitude = latitude;
    this.longitude = longitude;
    this.telefone = telefone;
    this.website = website;
  }

  async save() {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO estabelecimentos (place_id, nome, endereco, tipo, latitude, longitude, telefone, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      connect.query(
        query,
        [this.placeId, this.nome, this.endereco, this.tipo, this.latitude, this.longitude, this.telefone, this.website],
        (err, result) => {
          if (err) return reject(err);
          this.id = result.insertId;
          resolve(this);
        }
      );
    });
  }

  static findOne({ placeId }) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM estabelecimentos WHERE place_id = ? LIMIT 1`;
      connect.query(query, [placeId], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve(null);
        resolve(new Estabelecimento(results[0]));
      });
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM estabelecimentos`;
      connect.query(query, (err, results) => {
        if (err) return reject(err);
        const estabelecimentos = results.map(row => new Estabelecimento(row));
        resolve(estabelecimentos);
      });
    });
  }

  async update() {
    return new Promise((resolve, reject) => {
      const query = `UPDATE estabelecimentos SET nome = ?, endereco = ?, tipo = ?, latitude = ?, longitude = ?, telefone = ?, website = ? WHERE place_id = ?`;
      connect.query(
        query,
        [this.nome, this.endereco, this.tipo, this.latitude, this.longitude, this.telefone, this.website, this.placeId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }

  static delete(placeId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM estabelecimentos WHERE place_id = ?`;
      connect.query(query, [placeId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
};
