;; USDCx Token - SIP-010 Fungible Token for OnLoan Protocol
;; Stablecoin used as the borrow/lending asset

(impl-trait .sip-010-trait-v2.sip-010-trait)

(define-fungible-token usdcx-token)

(define-data-var token-name (string-ascii 32) "USDCx")
(define-data-var token-symbol (string-ascii 10) "USDCx")
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-decimals uint u6)
(define-data-var contract-owner principal tx-sender)

;; SIP-010: transfer
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq sender tx-sender) (err u4))
    (try! (ft-transfer? usdcx-token amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

;; SIP-010: get-name
(define-read-only (get-name)
  (ok (var-get token-name))
)

;; SIP-010: get-symbol
(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

;; SIP-010: get-decimals
(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

;; SIP-010: get-balance
(define-read-only (get-balance (who principal))
  (ok (ft-get-balance usdcx-token who))
)

;; SIP-010: get-total-supply
(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx-token))
)

;; SIP-010: get-token-uri
(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Mint (owner only)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u100))
    (ft-mint? usdcx-token amount recipient)
  )
)
