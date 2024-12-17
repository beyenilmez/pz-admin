package main

import (
	"encoding/json"
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
