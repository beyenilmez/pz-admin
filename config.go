package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"reflect"
	"strconv"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Config struct {
	Theme                *string `json:"theme"`                // system, light, dark
	ColorScheme          *string `json:"colorScheme"`          // default, midnightAsh
	UseSystemTitleBar    *bool   `json:"useSystemTitleBar"`    // true, false
	EnableLogging        *bool   `json:"enableLogging"`        // true, false
	EnableTrace          *bool   `json:"enableTrace"`          // true, false
	EnableDebug          *bool   `json:"enableDebug"`          // true, false
	EnableInfo           *bool   `json:"enableInfo"`           // true, false
	EnableWarn           *bool   `json:"enableWarn"`           // true, false
	EnableError          *bool   `json:"enableError"`          // true, false
	EnableFatal          *bool   `json:"enableFatal"`          // true, false
	MaxLogFiles          *int    `json:"maxLogFiles"`          // int
	Language             *string `json:"language"`             // en-US, tr-TR
	SaveWindowStatus     *bool   `json:"saveWindowStatus"`     // true, false
	WindowStartState     *int    `json:"windowStartState"`     // 0 = Normal, 1 = Maximized, 2 = Minimized, 3 = Fullscreen
	WindowStartPositionX *int    `json:"windowStartPositionX"` // x
	WindowStartPositionY *int    `json:"windowStartPositionY"` // y
	WindowStartSizeX     *int    `json:"windowStartSizeX"`     // x
	WindowStartSizeY     *int    `json:"windowStartSizeY"`     // y
	WindowScale          *int    `json:"windowScale"`          // %
	Opacity              *int    `json:"opacity"`              // %
	WindowEffect         *int    `json:"windowEffect"`         // 0 = Auto, 1 = None, 2 = Mica, 3 = Acrylic, 4 = Tabbed
	CheckForUpdates      *bool   `json:"checkForUpdates"`      // true, false
	LastUpdateCheck      *int    `json:"lastUpdateCheck"`      // unix timestamp
}

func GetDefaultConfig() Config {
	defaultTheme := "system"
	defaultColorScheme := "default"
	defaultUseSystemTitleBar := false
	defaultEnableLogging := true
	defaultEnableTrace := false
	defaultEnableDebug := false
	defaultEnableInfo := true
	defaultEnableWarn := true
	defaultEnableError := true
	defaultEnableFatal := true
	defaultMaxLogFiles := 20
	defaultLanguage := "en-US"
	defaultSaveWindowStatus := true
	defaultWindowStartState := 0
	defaultWindowStartPositionX := -100000
	defaultWindowStartPositionY := -100000
	defaultWindowStartSizeX := -100000
	defaultWindowStartSizeY := -100000
	defaultWindowScale := 100
	defaultOpacity := 80
	defaultWindowEffect := 3
	defaultCheckForUpdates := true
	defaultLastUpdateCheck := 0

	return Config{
		Theme:                &defaultTheme,
		ColorScheme:          &defaultColorScheme,
		UseSystemTitleBar:    &defaultUseSystemTitleBar,
		EnableLogging:        &defaultEnableLogging,
		EnableTrace:          &defaultEnableTrace,
		EnableDebug:          &defaultEnableDebug,
		EnableInfo:           &defaultEnableInfo,
		EnableWarn:           &defaultEnableWarn,
		EnableError:          &defaultEnableError,
		EnableFatal:          &defaultEnableFatal,
		MaxLogFiles:          &defaultMaxLogFiles,
		Language:             &defaultLanguage,
		SaveWindowStatus:     &defaultSaveWindowStatus,
		WindowStartState:     &defaultWindowStartState,
		WindowStartPositionX: &defaultWindowStartPositionX,
		WindowStartPositionY: &defaultWindowStartPositionY,
		WindowStartSizeX:     &defaultWindowStartSizeX,
		WindowStartSizeY:     &defaultWindowStartSizeY,
		WindowScale:          &defaultWindowScale,
		Opacity:              &defaultOpacity,
		WindowEffect:         &defaultWindowEffect,
		CheckForUpdates:      &defaultCheckForUpdates,
		LastUpdateCheck:      &defaultLastUpdateCheck,
	}
}

var config Config = GetDefaultConfig()

func config_init() error {
	err := CreateConfigIfNotExist()
	if err != nil {
		return errors.New("failed to create config file")
	}
	err = ReadConfig(configPath)
	if err != nil {
		config = GetDefaultConfig()
	} else {
		merge_defaults()
	}

	return nil
}

func merge_defaults() {
	defaultConfig := GetDefaultConfig()

	fmt.Println("Merging default config")

	v := reflect.ValueOf(&config).Elem()
	t := v.Type()

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fieldName := field.Name
		fieldValue := v.FieldByName(fieldName)

		if fieldValue.Kind() == reflect.Ptr && fieldValue.IsNil() {
			// If config's field is nil, set it to the default value's field
			defaultValue := reflect.ValueOf(&defaultConfig).Elem().FieldByName(fieldName)
			fieldValue.Set(defaultValue)
		}
	}
}

func (app *App) GetConfig() Config {
	return config
}

func (app *App) GetConfigField(fieldName string) interface{} {
	runtime.LogDebug(app.ctx, fmt.Sprintf("Attempting to get config field %s", fieldName))

	// Get the reflection Type and Value of the Config struct
	v := reflect.ValueOf(&config).Elem()
	t := v.Type()

	// Find the field by name
	_, found := t.FieldByName(fieldName)
	if !found {
		runtime.LogWarning(app.ctx, fmt.Sprintf("Unknown config field: %s", fieldName))
		return "undefined"
	}

	// Get the field value
	fieldValue := v.FieldByName(fieldName)

	// Check if the field is a pointer
	if fieldValue.Kind() == reflect.Ptr {
		if fieldValue.IsNil() {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Config field %s is nil", fieldName))
			return "undefined"
		}
		// Dereference the pointer
		fieldValue = fieldValue.Elem()
	}

	runtime.LogDebug(app.ctx, fmt.Sprintf("Config field %s has value: %v", fieldName, fieldValue.Interface()))
	return fieldValue.Interface()
}

func (app *App) SetConfigField(fieldName string, value interface{}) {
	runtime.LogDebug(app.ctx, fmt.Sprintf("Attempting to set config field %s to %v", fieldName, value))

	v := reflect.ValueOf(&config).Elem()
	t := v.Type()

	_, found := t.FieldByName(fieldName)
	if !found {
		runtime.LogWarning(app.ctx, fmt.Sprintf("Unknown config field: %s", fieldName))
		return
	}

	fieldValue := v.FieldByName(fieldName)

	if !fieldValue.IsValid() {
		runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid field: %s", fieldName))
		return
	}

	if fieldValue.Kind() == reflect.Ptr {
		runtime.LogDebug(app.ctx, fmt.Sprintf("Dereferencing config field %s", fieldName))
		fieldValue = fieldValue.Elem()
	}

	runtime.LogDebug(app.ctx, fmt.Sprintf("Config field %s type: %v", fieldName, fieldValue.Kind()))

	switch fieldValue.Kind() {
	case reflect.String:
		strVal, ok := value.(string)
		if !ok {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid value type for string field %s: %v", fieldName, value))
			return
		}
		fieldValue.SetString(strVal)

	case reflect.Bool:
		boolVal, ok := value.(bool)
		if !ok {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid value type for boolean field %s: %v", fieldName, value))
			return
		}
		fieldValue.SetBool(boolVal)

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		intVal, err := strconv.Atoi(fmt.Sprintf("%v", value))
		if err != nil {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid value type for integer field %s: %v", fieldName, value))
			return
		}
		fieldValue.SetInt(int64(intVal))

	case reflect.Float32, reflect.Float64:
		floatVal, ok := value.(float64)
		if !ok {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid value type for float field %s: %v", fieldName, value))
			return
		}
		fieldValue.SetFloat(floatVal)

	case reflect.Slice:
		sliceVal, ok := value.([]string)
		if !ok {
			runtime.LogWarning(app.ctx, fmt.Sprintf("Invalid value type for slice field %s: %v", fieldName, value))
			return
		}
		slice := reflect.ValueOf(sliceVal)
		fieldValue.Set(slice)

	default:
		runtime.LogWarning(app.ctx, fmt.Sprintf("Unsupported field type for field %s of type %s", fieldName, fieldValue.Kind()))
		return
	}

	runtime.LogDebug(app.ctx, fmt.Sprintf("Config field %s set to %v", fieldName, fieldValue.Interface()))
}

// Creates a default config at configPath if none exists
func CreateConfigIfNotExist() error {
	configPath = get_config_path()

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		config = GetDefaultConfig()
	}
	return nil
}

// WriteConfig writes the current config to the path
func WriteConfig(path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(config)
	if err != nil {
		return err
	}

	return nil
}

// Read config from path
func ReadConfig(path string) error {
	file, err := os.Open(path)

	if err != nil {
		return err
	}

	defer file.Close()
	decoder := json.NewDecoder(file)

	config = Config{}

	err = decoder.Decode(&config)
	if err != nil {
		return err
	}

	return nil
}

func (app *App) ReadConfig(path string) error {
	return ReadConfig(path)
}
