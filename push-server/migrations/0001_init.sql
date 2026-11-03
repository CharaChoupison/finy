-- Un appareil = une adresse push et l'empreinte de son jeton secret.
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Heures (secondes Unix) où réveiller un appareil. Rien d'autre : ni nom, ni montant.
CREATE TABLE pushes (
  device_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (device_id, at)
);

CREATE INDEX pushes_at ON pushes (at);
