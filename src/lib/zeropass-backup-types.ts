export type PinBackup = {
	method: "pin";
	v: 1;
	kdf: "PBKDF2-SHA256";
	iterations: number;
	salt: string;
	iv: string;
	ciphertext: string;
};

export type AnyBackup = PinBackup;
