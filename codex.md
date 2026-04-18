# FitCheck Project Plan

## Vision

FitCheck is a virtual try-on platform for archive and secondhand fashion marketplaces such as Grailed and Mercari. The goal is to help users understand how an item will actually look on their body before they buy it.

The product should make it easy for a user to:

- create a personal body profile
- generate a reusable avatar or model
- browse fashion items from marketplace listings
- try clothing on digitally
- save outfits to a personal closet
- browse suggested looks from other users
- spend credits on premium try-on renders

## Core Problem

Users shopping on resale and archive sites often struggle to answer basic fit questions:

- Will this item look oversized or fitted on me?
- Will these pants stack correctly on my shoes?
- Does this silhouette work with my body shape?
- Is this piece worth buying if I cannot try it on first?

FitCheck solves this by combining body profile onboarding, item browsing, and AI-generated try-on previews.

## Product Pillars

### 1. Body Profile

Users upload photos and provide measurements to create a persistent body profile.

Inputs:

- front photo
- side photo
- optional back photo
- height
- weight
- inseam
- chest
- waist
- shoulder width
- usual tops size
- usual bottoms size
- fit preference

Outputs:

- normalized body profile
- reusable avatar/model
- fit preferences for future rendering

### 2. Marketplace Browse

Users browse imported clothing listings and filter by source, category, price, brand, and size.

Initial marketplace targets:

- Grailed
- Mercari

MVP note:

For the first version, we can use curated sample item data before building full marketplace ingestion.

### 3. Virtual Try-On

Users select an item and render a preview of how it may look on their model.

Key try-on interactions:

- choose size
- adjust fit preference
- preview layering
- rotate or switch pose if supported
- compare original item image with rendered output
- save rendered look

### 4. Closet and Lookbook

Users can save favorite items and complete outfits.

Closet features:

- saved items
- saved outfits
- wishlist
- previous renders

Lookbook features:

- browse community outfits
- see suggested looks
- discover similar silhouettes and styling ideas

### 5. Credits and Payments

Rendering costs credits.

Example pricing model:

- new user signup bonus: 3 free credits
- standard render: 1 credit
- premium render: 3 credits
- outfit render bundle: 5 credits

Monetization can later expand into subscriptions or affiliate commissions.

## Recommended MVP

The MVP should avoid true 3D garment simulation. That is too complex for an initial build.

Instead, the MVP should focus on image-based virtual try-on with a strong product demo.

MVP capabilities:

- user onboarding with body profile input
- reusable user avatar/model
- curated marketplace browse experience
- item detail page
- try-on render workflow
- save to closet
- simple outfit suggestions
- credit balance and render usage tracking

## Non-MVP for Initial Version

These are valuable, but should not block the first release:

- real-time physics-based cloth simulation
- highly accurate 360-degree 3D model rendering
- broad live scraping across many marketplaces
- advanced social features
- full recommendation engine personalization

## User Flow

### Onboarding Flow

1. User signs up
2. User uploads body photos
3. User enters measurements and usual sizes
4. System creates body profile and avatar/model
5. User receives starter credits

### Try-On Flow

1. User browses or searches for an item
2. User opens the item detail page
3. User chooses size or fit variation if available
4. User clicks try on
5. System generates render
6. Credits are deducted
7. User saves the result to closet or lookbook

### Discovery Flow

1. User opens lookbook
2. User browses saved outfits from the community
3. User finds a look they like
4. User opens similar items or tries the outfit style on their own model

## App Routes

Suggested route structure:

- `/` landing page
- `/onboarding` body profile setup
- `/browse` marketplace search and filtering
- `/item/:id` individual item details
- `/try-on` main rendering workspace
- `/closet` saved items and outfits
- `/lookbook` outfit discovery and suggestions
- `/credits` wallet, pricing, and render history
- `/account` profile, measurements, and preferences

## Technical Direction

### Frontend

The UI should follow the retro desktop / Y2K virtual fitting room style shown in the concept image:

- dark atmospheric background
- neon purple and pink accents
- pixel or arcade-inspired typography where appropriate
- dashboard-like workspace with browse, closet, and try-on panels

Primary frontend needs:

- route-based app shell
- browse grid for items
- try-on workspace
- closet panel
- lookbook feed
- credits dashboard

### Backend Services

The system can be separated into the following service responsibilities:

#### Body Profile Service

Responsible for:

- processing body photos
- storing measurement data
- producing normalized body profile inputs

#### Garment Understanding Service

Responsible for:

- item classification
- image cleanup
- clothing segmentation or masking
- extracting fit-related metadata

#### Virtual Try-On Service

Responsible for:

- combining user profile and garment data
- generating try-on renders
- storing outputs
- tracking render status

#### Recommendation Service

Responsible for:

- suggested outfits
- similar looks
- closet-based recommendations

#### Billing Service

Responsible for:

- credit balance
- credit deductions
- purchase history

## Data Model

Core entities:

- `users`
- `body_profiles`
- `avatars`
- `marketplace_items`
- `item_measurements`
- `try_on_renders`
- `closet_items`
- `saved_outfits`
- `credit_wallets`
- `credit_transactions`

Important fields by entity:

### `body_profiles`

- `user_id`
- `height`
- `weight`
- `inseam`
- `chest`
- `waist`
- `shoulder_width`
- `usual_top_size`
- `usual_bottom_size`
- `fit_preference`
- `photo_refs`

### `avatars`

- `user_id`
- `body_profile_id`
- `base_image_url`
- `pose_type`
- `status`

### `marketplace_items`

- `source`
- `source_url`
- `title`
- `brand`
- `category`
- `tagged_size`
- `price`
- `currency`
- `condition`
- `image_urls`

### `try_on_renders`

- `user_id`
- `item_id`
- `avatar_id`
- `status`
- `output_image_url`
- `credits_used`
- `created_at`

### `credit_wallets`

- `user_id`
- `balance`

### `credit_transactions`

- `user_id`
- `amount`
- `type`
- `description`
- `created_at`

## AI System Plan

For version 1, the focus should be believable and personalized output, not perfect physical accuracy.

Recommended processing pipeline:

1. collect body photos and measurements
2. create normalized body profile
3. ingest marketplace item data and clothing images
4. extract clothing mask and metadata
5. generate virtual try-on render
6. return final output to the user and save render history

Important principle:

Consistency matters more than scientific precision in the first version. The render should feel useful, stylish, and directionally accurate.

## Rendering Philosophy

The rendered person shown in the try-on experience should not be the same person for every user.

FitCheck should use a consistent visual presentation layer while generating a different personalized model for each user.

What should remain consistent across renders:

- overall FitCheck visual identity
- lighting direction and mood
- camera framing
- pose family
- polished fashion-editorial presentation

What should change per user:

- face structure
- skin tone
- hairstyle
- hair color
- body composition
- height proportion
- shoulder width
- leg shape
- overall silhouette

Core product principle:

Every render should feel like it belongs in the same FitCheck universe, but it should still look like a different real person based on the user.

## Avatar Generation Pipeline

Recommended avatar creation flow:

1. collect user appearance inputs
2. extract stable identity and body attributes
3. generate a personalized base avatar in the FitCheck house style
4. reuse that avatar across multiple try-on renders
5. apply clothing items and fit adjustments on top of the avatar

### User Appearance Inputs

The system should combine visual and structured inputs:

- front photo
- side photo
- optional back photo
- height
- weight
- body measurements
- usual sizes
- fit preference

### Identity Profile Extraction

The system should infer or store stable user attributes such as:

- face shape
- hairstyle and length
- skin tone
- body proportions
- weight distribution
- shoulder and leg silhouette

This profile becomes the reusable foundation for later renders.

### Base Avatar Generation

FitCheck should create a personalized avatar that matches the product's visual style.

This avatar should preserve:

- a consistent pose system
- a controlled camera angle
- a controlled lighting setup
- a consistent rendering quality bar

This allows the product to feel cohesive while still representing each individual user.

## Identity Layer vs Fit Layer

The rendering system should be thought of as two connected layers.

### Identity Layer

This defines who the person is visually:

- face and hair
- skin tone
- body shape
- height and proportions
- persistent avatar traits

This layer should change only when the user's profile changes.

### Fit Layer

This defines how the clothing sits on that person:

- fitted vs oversized feel
- garment drape
- pant length and stacking
- sleeve length
- layering behavior
- silhouette interaction between item and body

This layer should change with the selected item, size, and styling controls.

Separating these two layers is important because it allows the app to reuse a user's personalized avatar instead of regenerating the full person from scratch every time.

## Accuracy Goals and Limitations

FitCheck should aim for strong identity similarity and useful fit prediction, but should not promise perfect one-to-one realism in the first version.

Recommended quality targets:

- high visual similarity to the user
- strong body-shape similarity
- consistent silhouette prediction
- believable styling output
- directionally useful fit guidance

The product should avoid overpromising exact precision on:

- exact fabric physics
- exact garment stretch behavior
- exact drape from limited listing photos
- exact one-to-one body reconstruction

A better product claim for the MVP is:

FitCheck gives users a personalized and directionally accurate preview of how a piece may look on their body before purchase.

## Major Risks

Primary product and technical risks:

- poor item image quality from marketplace sources
- inconsistent or missing garment measurements
- unrealistic clothing drape or layering
- slow render times
- low trust if outputs look unstable across retries

To reduce risk early, the first implementation should prioritize:

- front-facing renders
- tops and outerwear before more difficult categories
- curated sample data
- a polished and fast demo experience

## Phased Build Plan

### Phase 1: Demoable Frontend

Build a polished interface that captures the concept:

- app shell and navigation
- retro try-on dashboard UI
- browse page with sample listings
- item detail page
- closet and lookbook pages
- credits UI

### Phase 2: Core Product Logic

Add real app behavior:

- onboarding flow
- body profile form
- sample user avatar state
- saved items and saved outfits
- render job state management
- credit deduction logic

### Phase 3: Backend and Persistence

Add a real backend foundation:

- database schema
- authentication
- storage for images and renders
- API endpoints for items, closet, renders, and credits

### Phase 4: AI Integration

Connect external or internal AI services for:

- body profile processing
- garment analysis
- virtual try-on rendering
- recommendation generation

## Design Principles

- Keep the experience visually memorable and fashion-forward.
- Prioritize confidence and trust in the output.
- Make the product feel fast, even if rendering is asynchronous.
- Keep the onboarding short enough that users reach a try-on quickly.
- Design for aspirational styling, not just technical garment matching.

## Immediate Next Steps

Recommended next execution order:

1. scaffold the frontend app routes and overall layout
2. build the browse and try-on dashboard experience
3. define the sample data model for users, items, outfits, and credits
4. implement onboarding and closet flows
5. connect backend persistence
6. integrate AI rendering

## One-Sentence Pitch

FitCheck helps shoppers on Grailed, Mercari, and other archive marketplaces see how clothes will look on their specific body before they buy, using virtual try-on, saved outfits, and credit-based renders.
