package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func writeJSON(path string, data interface{}) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewEncoder(file).Encode(data)
}

func readJSON(path string, data interface{}) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewDecoder(file).Decode(data)
}

func create_folder(folder string) error {
	if _, err := os.Stat(folder); os.IsNotExist(err) {
		err = os.MkdirAll(folder, 0o755)
		if err != nil {
			return err
		}
	} else {
		runtime.LogDebug(appContext, "Folder already exists: "+folder)
		return nil
	}
	runtime.LogDebug(appContext, "Created folder: "+folder)

	return nil
}

func file_exists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func generateKey(passphrase string) []byte {
	hash := sha256.Sum256([]byte(passphrase))
	return hash[:]
}

func Encrypt(plaintext, key string) (string, error) {
	aesKey := generateKey(key)
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	ciphertext := make([]byte, aes.BlockSize+len(plaintext))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], []byte(plaintext))

	// Base64 encode the ciphertext
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(encryptedText, key string) (string, error) {
	aesKey := generateKey(key)
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	// Base64 decode the encrypted text
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	if len(ciphertext) < aes.BlockSize {
		return "", errors.New("ciphertext too short")
	}

	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(ciphertext, ciphertext)

	return string(ciphertext), nil
}

func (app *App) Format(t string, args ...interface{}) string {
	return fmt.Sprintf(t, args...)
}

func (a *App) CopyToClipboard(text string, sendNotification bool) {
	err := runtime.ClipboardSetText(a.ctx, text)
	if err != nil {
		runtime.LogErrorf(appContext, "Error copying to clipboard: %s", err.Error())
		if sendNotification {
			a.SendNotification(Notification{
				Message: "Error copying to clipboard",
				Variant: "error",
			})
		}
		return
	}

	if sendNotification {
		a.SendNotification(Notification{
			Message: "Copied to clipboard",
			Variant: "success",
		})
	}
}
