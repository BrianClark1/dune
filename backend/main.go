package main

//import (
//	"context"
//	"encoding/json"
//	"fmt"
//	"log"
//	"os"
//	"os/signal"
//	"sync"
//	"syscall"
//	"time"
//
//	"github.com/gofiber/fiber/v2/middleware/cors"
//	"go.mongodb.org/mongo-driver/bson"
//	"go.mongodb.org/mongo-driver/bson/primitive"
//	"go.mongodb.org/mongo-driver/mongo"
//	"go.mongodb.org/mongo-driver/mongo/options"
//)

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	fiber "github.com/gofiber/fiber/v2"
	cors "github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type FieldType string

const (
	FieldText     FieldType = "text"
	FieldMC                 = "multiple_choice"
	FieldCheckbox           = "checkbox"
	FieldRating             = "rating"
)

type Field struct {
	ID       string    `bson:"id" json:"id"`
	Type     FieldType `bson:"type" json:"type"`
	Label    string    `bson:"label" json:"label"`
	Options  []string  `bson:"options,omitempty" json:"options,omitempty"`
	Required bool      `bson:"required" json:"required"`
	Max      int       `bson:"max,omitempty" json:"max,omitempty"` // for rating
}

type Form struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string             `bson:"title" json:"title"`
	Fields    []Field            `bson:"fields" json:"fields"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type Response struct {
	ID        primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	FormID    primitive.ObjectID     `bson:"formId" json:"formId"`
	Answers   map[string]interface{} `bson:"answers" json:"answers"`
	CreatedAt time.Time              `bson:"createdAt" json:"createdAt"`
}

type Analytics struct {
	FormID  string                        `json:"formId"`
	ByField map[string]map[string]float64 `json:"byField"`
	At      time.Time                     `json:"at"`
}

var (
	client    *mongo.Client
	db        *mongo.Database
	forms     *mongo.Collection
	responses *mongo.Collection

	broker = &Broker{
		subs: map[string]map[chan []byte]struct{}{},
		mu:   &sync.RWMutex{},
	}
)

type Broker struct {
	subs map[string]map[chan []byte]struct{}
	mu   *sync.RWMutex
}

func (b *Broker) Subscribe(formId string) chan []byte {
	ch := make(chan []byte, 1)
	b.mu.Lock()
	defer b.mu.Unlock()
	if _, ok := b.subs[formId]; !ok {
		b.subs[formId] = map[chan []byte]struct{}{}
	}
	b.subs[formId][ch] = struct{}{}
	return ch
}
func (b *Broker) Unsubscribe(formId string, ch chan []byte) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if m, ok := b.subs[formId]; ok {
		delete(m, ch)
		close(ch)
		if len(m) == 0 {
			delete(b.subs, formId)
		}
	}
}
func (b *Broker) Broadcast(formId string, payload []byte) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	if m, ok := b.subs[formId]; ok {
		for ch := range m {
			select {
			case ch <- payload:
			default:
			}
		}
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	log.Printf("HELOOOOOOOOOOO")
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Get MongoDB connection details from environment
	mongoURI := envOr("MONGODB_URI", "mongodb://localhost:27017")
	dbName := envOr("MONGODB_DB", "dune")
	port := envOr("PORT", "8080")
	origin := envOr("ORIGIN", "http://localhost:3000")

	// Set up MongoDB connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Connecting to MongoDB at %s (database: %s)", mongoURI, dbName)

	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("mongo connect: %v", err)
	}

	// Test the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("mongo ping: %v", err)
	}

	log.Printf("Successfully connected to MongoDB")

	db = client.Database(dbName)
	forms = db.Collection("forms")
	responses = db.Collection("responses")

	client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("mongo connect: %v", err)
	}
	db = client.Database(dbName)
	forms = db.Collection("forms")
	responses = db.Collection("responses")

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     origin,
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept",
	}))

	api := app.Group("/api")

	api.Post("/forms", createForm)
	api.Get("/forms/:id", getForm)
	api.Put("/forms/:id", updateForm)

	api.Post("/forms/:id/responses", submitResponse)

	api.Get("/forms/:id/analytics", getAnalytics)
	api.Get("/forms/:id/analytics/stream", analyticsStream)

	app.Get("/healthz", func(c *fiber.Ctx) error { return c.SendString("ok") })

	go func() {
		log.Printf("Listening on :%s", port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("server: %v", err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	_ = app.Shutdown()
	_ = client.Disconnect(context.Background())
}

func createForm(c *fiber.Ctx) error {
	var in Form
	if err := c.BodyParser(&in); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	in.ID = primitive.NilObjectID
	in.CreatedAt = time.Now()
	if in.Title == "" {
		in.Title = "Untitled Form"
	}
	for i := range in.Fields {
		if in.Fields[i].ID == "" {
			in.Fields[i].ID = primitive.NewObjectID().Hex()
		}
		if in.Fields[i].Type == FieldRating && in.Fields[i].Max == 0 {
			in.Fields[i].Max = 5
		}
	}
	res, err := forms.InsertOne(c.Context(), in)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	in.ID = res.InsertedID.(primitive.ObjectID)
	return c.Status(fiber.StatusCreated).JSON(in)
}

func getForm(c *fiber.Ctx) error {
	idHex := c.Params("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var f Form
	if err := forms.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "not found")
	}
	return c.JSON(f)
}

func updateForm(c *fiber.Ctx) error {
	idHex := c.Params("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var in Form
	if err := c.BodyParser(&in); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	for i := range in.Fields {
		if in.Fields[i].ID == "" {
			in.Fields[i].ID = primitive.NewObjectID().Hex()
		}
	}
	_, err = forms.UpdateByID(c.Context(), oid, bson.M{"$set": bson.M{"title": in.Title, "fields": in.Fields}})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	var f Form
	if err := forms.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "updated but readback failed")
	}
	return c.JSON(f)
}

func submitResponse(c *fiber.Ctx) error {
	idHex := c.Params("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var f Form
	if err := forms.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	var in map[string]interface{}
	if err := json.Unmarshal(c.Body(), &in); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	for _, fld := range f.Fields {
		val, ok := in[fld.ID]
		if !ok {
			if fld.Required {
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s is required", fld.Label))
			}
			continue
		}
		switch fld.Type {
		case FieldText:
			if _, ok := val.(string); !ok {
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s must be string", fld.Label))
			}
		case FieldMC:
			if s, ok := val.(string); !ok || !contains(fld.Options, s) {
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s must be one of options", fld.Label))
			}
		case FieldCheckbox:
			switch vv := val.(type) {
			case []interface{}:
				for _, item := range vv {
					s, ok := item.(string)
					if !ok || !contains(fld.Options, s) {
						return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s invalid checkbox options", fld.Label))
					}
				}
			default:
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s must be array of strings", fld.Label))
			}
		case FieldRating:
			switch v := val.(type) {
			case float64:
				if v < 1 || int(v) > fld.Max {
					return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s rating must be 1..%d", fld.Label, fld.Max))
				}
			case int:
				if v < 1 || v > fld.Max {
					return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s rating must be 1..%d", fld.Label, fld.Max))
				}
			default:
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("field %s must be number", fld.Label))
			}
		}
	}
	resp := Response{FormID: oid, Answers: in, CreatedAt: time.Now()}
	if _, err := responses.InsertOne(c.Context(), resp); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	an, _ := computeAnalytics(c.Context(), oid, &f)
	payload, _ := json.Marshal(an)
	broker.Broadcast(oid.Hex(), payload)
	return c.SendStatus(fiber.StatusCreated)
}

func getAnalytics(c *fiber.Ctx) error {
	idHex := c.Params("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var f Form
	if err := forms.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	an, err := computeAnalytics(c.Context(), oid, &f)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(an)
}

func analyticsStream(c *fiber.Ctx) error {
	idHex := c.Params("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var f Form
	if err := forms.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	an, _ := computeAnalytics(c.Context(), oid, &f)
	initial, _ := json.Marshal(an)

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	ch := broker.Subscribe(oid.Hex())
	defer broker.Unsubscribe(oid.Hex(), ch)

	fmt.Fprintf(c, "event: analytics\ndata: %s\n\n", string(initial))

	notify := c.Context().Done()
	for {
		select {
		case <-notify:
			return nil
		case payload := <-ch:
			fmt.Fprintf(c, "event: analytics\ndata: %s\n\n", string(payload))
		}
	}
}

func computeAnalytics(ctx context.Context, formID primitive.ObjectID, f *Form) (*Analytics, error) {
	cur, err := responses.Find(ctx, bson.M{"formId": formID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	byField := map[string]map[string]float64{}

	type ratingAgg struct{ Sum, Cnt float64 }
	ratingAcc := map[string]*ratingAgg{}
	ratingDist := map[string]map[string]float64{}

	for _, fld := range f.Fields {
		switch fld.Type {
		case FieldMC, FieldCheckbox:
			m := map[string]float64{}
			for _, opt := range fld.Options {
				m[opt] = 0
			}
			byField[fld.ID] = m
		case FieldText:
			byField[fld.ID] = map[string]float64{"responses": 0}
		case FieldRating:
			byField[fld.ID] = map[string]float64{"avg": 0}
			ratingAcc[fld.ID] = &ratingAgg{}
			rd := map[string]float64{}
			for i := 1; i <= max(2, fld.Max); i++ {
				rd[fmt.Sprintf("%d", i)] = 0
			}
			ratingDist[fld.ID] = rd
		}
	}

	for cur.Next(ctx) {
		var r Response
		if err := cur.Decode(&r); err != nil {
			continue
		}
		for _, fld := range f.Fields {
			val, ok := r.Answers[fld.ID]
			if !ok {
				continue
			}
			switch fld.Type {
			case FieldText:
				byField[fld.ID]["responses"] += 1
			case FieldMC:
				if s, ok := val.(string); ok {
					byField[fld.ID][s] += 1
				}
			case FieldCheckbox:
				if arr, ok := val.(bson.A); ok {
					for _, it := range arr {
						if s, ok := it.(string); ok {
							byField[fld.ID][s] += 1
						}
					}
				} else if ifaceArr, ok := val.([]interface{}); ok {
					for _, it := range ifaceArr {
						if s, ok := it.(string); ok {
							byField[fld.ID][s] += 1
						}
					}
				}
			case FieldRating:
				switch vv := val.(type) {
				case int32, int64, int:
					num := float64(anyToInt(vv))
					acc := ratingAcc[fld.ID]
					acc.Sum += num
					acc.Cnt += 1
					ratingDist[fld.ID][fmt.Sprintf("%d", int(num))] += 1
				case float64:
					acc := ratingAcc[fld.ID]
					acc.Sum += vv
					acc.Cnt += 1
					ratingDist[fld.ID][fmt.Sprintf("%d", int(vv))] += 1
				}
			}
		}
	}
	for _, fld := range f.Fields {
		if fld.Type == FieldRating {
			agg := ratingAcc[fld.ID]
			if agg != nil && agg.Cnt > 0 {
				byField[fld.ID]["avg"] = agg.Sum / agg.Cnt
			}
			for k, v := range ratingDist[fld.ID] {
				byField[fld.ID]["dist_"+k] = v
			}
		}
	}

	return &Analytics{FormID: formID.Hex(), ByField: byField, At: time.Now()}, nil
}

func anyToInt(v interface{}) int {
	switch t := v.(type) {
	case int:
		return t
	case int32:
		return int(t)
	case int64:
		return int(t)
	default:
		return 0
	}
}

func contains(arr []string, s string) bool {
	for _, v := range arr {
		if v == s {
			return true
		}
	}
	return false
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
