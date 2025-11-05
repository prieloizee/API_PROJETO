CREATE DATABASE IF NOT EXISTS `projeto_final`
  /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
  /*!80016 DEFAULT ENCRYPTION='N' */;

USE `projeto_final`;


DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `cpf` CHAR(11) NOT NULL,
  `imagem` LONGBLOB,
  `tipo_imagem` VARCHAR(100) DEFAULT NULL,
  `verification_code` VARCHAR(6) NULL,
  `verification_expires` DATETIME NULL,
  `email_verified` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



DROP TABLE IF EXISTS `avaliacoes`;
CREATE TABLE `avaliacoes` (
  `id_avaliacao` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `google_place_id` VARCHAR(255) NOT NULL,
  `comentario` TEXT NOT NULL,
  `nota` TINYINT NOT NULL CHECK (`nota` BETWEEN 1 AND 5),
  `endereco` VARCHAR(255) DEFAULT NULL,
  `nome_estabelecimento` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_avaliacao`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `avaliacoes_ibfk_1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `favoritos`;
CREATE TABLE `favoritos` (
  `id_favorito` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `google_place_id` VARCHAR(255) NOT NULL,
  `nome_estabelecimento` VARCHAR(255) DEFAULT NULL,
  `endereco` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_favorito`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `favoritos_ibfk_1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario` (`id_usuario`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE IF NOT EXISTS `temp_email_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expiracao` DATETIME NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `temp_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `cpf` VARCHAR(20) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expiracao` DATETIME NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `temp_reset_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expiracao` DATETIME NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
