package main

import (
	"context"
	"github.com/gofiber/fiber/v2"
	"log"
	"math/rand"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func seedData(c *fiber.Ctx) error {
	// Demo form template
	form := Form{
		ID:        primitive.NewObjectID(),
		Title:     "Conference Feedback",
		CreatedAt: time.Now(),
		Fields: []Field{
			{
				ID:       primitive.NewObjectID().Hex(),
				Type:     "text",
				Label:    "Full Name",
				Required: true,
			},
			{
				ID:       primitive.NewObjectID().Hex(),
				Type:     "rating",
				Label:    "How satisfied were you with the conference?",
				Required: true,
				Max:      5,
			},
			{
				ID:       primitive.NewObjectID().Hex(),
				Type:     "multiple_choice",
				Label:    "Which track did you find most valuable?",
				Required: true,
				Options:  []string{"Technical", "Business", "Design", "Marketing"},
			},
			{
				ID:       primitive.NewObjectID().Hex(),
				Type:     "checkbox",
				Label:    "What areas could we improve?",
				Required: false,
				Options:  []string{"Content", "Scheduling", "Venue", "Food", "Networking"},
			},
			{
				ID:       primitive.NewObjectID().Hex(),
				Type:     "text",
				Label:    "Additional feedback",
				Required: false,
			},
		},
	}

	// Insert form
	_, err := forms.InsertOne(c.Context(), form)
	if err != nil {
		return err
	}

	// Generate responses
	names := []string{"Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Jamie"}
	feedback := []string{
		"Great conference!", "Looking forward to next year",
		"The speakers were excellent", "Learned a lot",
		"", "", "", "", // Some empty responses
	}

	for i := 0; i < 100; i++ {
		resp := bson.M{
			"formId": form.ID,
			"answers": bson.M{
				form.Fields[0].ID: names[rand.Intn(len(names))] + " " + names[rand.Intn(len(names))],
				form.Fields[1].ID: rand.Intn(5) + 1,
				form.Fields[2].ID: form.Fields[2].Options[rand.Intn(len(form.Fields[2].Options))],
				form.Fields[3].ID: randomSubset(form.Fields[3].Options),
				form.Fields[4].ID: feedback[rand.Intn(len(feedback))],
			},
			"createdAt": time.Now().Add(-time.Duration(rand.Intn(7*24)) * time.Hour),
		}
		_, err = responses.InsertOne(context.Background(), resp)
		if err != nil {
			log.Printf("Error inserting response: %v", err)
		}
	}

	return c.JSON(fiber.Map{
		"message": "Seeded successfully",
		"formId":  form.ID.Hex(),
	})
}

func randomSubset(items []string) []string {
	if len(items) == 0 {
		return []string{}
	}
	result := make([]string, 0)
	for _, item := range items {
		if rand.Float32() < 0.3 {
			result = append(result, item)
		}
	}
	if len(result) == 0 {
		return []string{items[rand.Intn(len(items))]}
	}
	return result
}
