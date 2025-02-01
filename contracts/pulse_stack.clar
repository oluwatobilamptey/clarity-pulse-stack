;; PulseStack - Financial Planning Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-invalid-period (err u103))

;; Data Variables
(define-data-var total-transactions uint u0)

;; Data Maps
(define-map transactions uint {
    user: principal,
    amount: int,
    category: (string-ascii 24),
    description: (string-ascii 64),
    timestamp: uint
})

(define-map budgets principal {
    monthly-limit: uint,
    spent: uint,
    last-reset: uint
})

(define-map goals principal {
    target: uint,
    saved: uint,
    deadline: uint,
    name: (string-ascii 64)
})

(define-map recurring-transactions principal {
    amount: int,
    category: (string-ascii 24),
    description: (string-ascii 64),
    period: uint,
    last-executed: uint,
    active: bool
})

;; Public Functions

;; Add a new transaction
(define-public (add-transaction (amount int) (category (string-ascii 24)) (description (string-ascii 64)))
    (let
        ((tx-id (var-get total-transactions)))
        (map-set transactions tx-id {
            user: tx-sender,
            amount: amount,
            category: category,
            description: description,
            timestamp: block-height
        })
        (var-set total-transactions (+ tx-id u1))
        (ok tx-id)
    )
)

;; Set up recurring transaction
(define-public (setup-recurring-transaction (amount int) (category (string-ascii 24)) (description (string-ascii 64)) (period uint))
    (if (< period u1)
        err-invalid-period
        (ok (map-set recurring-transactions tx-sender {
            amount: amount,
            category: category,
            description: description,
            period: period,
            last-executed: block-height,
            active: true
        }))
    )
)

;; Execute recurring transactions
(define-public (execute-recurring-transactions)
    (let ((recurring (unwrap! (map-get? recurring-transactions tx-sender) (err u404))))
        (if (and
                (get active recurring)
                (>= (- block-height (get last-executed recurring)) (get period recurring)))
            (begin
                (add-transaction (get amount recurring) (get category recurring) (get description recurring))
                (ok (map-set recurring-transactions tx-sender 
                    (merge recurring { last-executed: block-height })))
            )
            (ok recurring)
        )
    )
)

;; Cancel recurring transaction
(define-public (cancel-recurring-transaction)
    (let ((recurring (unwrap! (map-get? recurring-transactions tx-sender) (err u404))))
        (ok (map-set recurring-transactions tx-sender
            (merge recurring { active: false })))
    )
)

;; Set monthly budget
(define-public (set-budget (monthly-limit uint))
    (ok (map-set budgets tx-sender {
        monthly-limit: monthly-limit,
        spent: u0,
        last-reset: block-height
    }))
)

;; Add financial goal
(define-public (set-goal (target uint) (deadline uint) (name (string-ascii 64)))
    (ok (map-set goals tx-sender {
        target: target,
        saved: u0,
        deadline: deadline,
        name: name
    }))
)

;; Update goal progress
(define-public (update-goal-progress (amount uint))
    (let ((current-goal (unwrap! (map-get? goals tx-sender) (err u404))))
    (ok (map-set goals tx-sender 
        (merge current-goal { saved: (+ amount (get saved current-goal)) })))
)

;; Read-only functions

;; Get transaction by ID
(define-read-only (get-transaction (tx-id uint))
    (map-get? transactions tx-id)
)

;; Get user's budget
(define-read-only (get-budget (user principal))
    (map-get? budgets user)
)

;; Get user's goal
(define-read-only (get-goal (user principal))
    (map-get? goals user)
)

;; Get user's recurring transaction
(define-read-only (get-recurring-transaction (user principal))
    (map-get? recurring-transactions user)
)

;; Get total number of transactions
(define-read-only (get-total-transactions)
    (ok (var-get total-transactions))
)
