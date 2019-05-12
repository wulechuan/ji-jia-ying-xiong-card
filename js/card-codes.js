window.cardCodesManager = {
    classNames: {
        bordersCommon: 'border',
        bordersNamePrefix: 'border-',
        borderNames: ['top', 'right', 'bottom', 'left'],
        borderDotsCommon: 'border-dot',
        borderDotOfEmpty: 'empty',
        borderDotOfFilled: 'filled',
    },

    domSelectors: {
        root: '.card .frame',
        jiJiaPreview: '.card .frame .ji-jia-preview',
        valueSlotOfShowingIndexOfTriedRandomCodes: '.value-slot-for-showing-index-of-tried-random-codes',
        buttonTryAnotherRandomCardCode: '.button-for-trying-another-random-card-code',
        buttonShowPrevTriedRandomCode: '.button-for-going-to-prev-random-card-code',
        buttonShowNextTriedRandomCode: '.button-for-going-to-next-random-card-code',
    },

    options: {
        intervalInSeconds: 6,
        $randomCardCodeName: 'new random code',
    },

    el: {
        // root: null,
        // cardPreviewDOM: null,
    },

    data: {
        triedCodes: [],
        manuallyFixedBits: null,
        autoDetectedFixedBitsAcrossAllKnownCards: null,
        fixedBits: null,
    },

    status: {
        intervalId: NaN,
        isShowingRandomCodes: false,
        triedCodesShowingIndex: NaN,
    },

    init({
        knownCardCodeStrings,
        shouldStartIntervalAtBeginning,
        initialKnownCardCodeName,
        intervalInSeconds,
    }) {
        const { domSelectors, el } = this
        const rootDOM = document.querySelector(domSelectors.root)

        if (!rootDOM) {
            console.error(`Failed to get DOM root via selector "${
                domSelectors.root
            }".`)
            return false
        }

        const cardPreviewDOM = document.querySelector(domSelectors.jiJiaPreview)
        if (!cardPreviewDOM) {
            console.error(`Failed to get DOM via selector "${
                domSelectors.jiJiaPreview
            }".`)
            return false
        }

        const buttonDOMForTryingAnotherRandomCardCode = document.querySelector(domSelectors.buttonTryAnotherRandomCardCode)
        if (!buttonDOMForTryingAnotherRandomCardCode) {
            console.error(`Failed to get DOM via selector "${
                domSelectors.buttonTryAnotherRandomCardCode
            }".`)
            return false
        }

        const buttonDOMForShowingPrevTriedRandomCode = document.querySelector(domSelectors.buttonShowPrevTriedRandomCode)
        if (!buttonDOMForShowingPrevTriedRandomCode) {
            console.error(`Failed to get DOM via selector "${
                domSelectors.buttonShowPrevTriedRandomCode
            }".`)
            return false
        }

        const buttonDOMForShowingNextTriedRandomCode = document.querySelector(domSelectors.buttonShowNextTriedRandomCode)
        if (!buttonDOMForShowingNextTriedRandomCode) {
            console.error(`Failed to get DOM via selector "${
                domSelectors.buttonShowNextTriedRandomCode
            }".`)
            return false
        }

        const valueSlotDOM = document.querySelector(domSelectors.valueSlotOfShowingIndexOfTriedRandomCodes)
        if (!valueSlotDOM) {
            console.error(`Failed to get DOM via selector "${
                domSelectors.valueSlotOfShowingIndexOfTriedRandomCodes
            }".`)
            return false
        }

        el.root = rootDOM
        el.cardPreviewDOM = cardPreviewDOM
        el.buttonForTryingAnotherRandomCardCode = buttonDOMForTryingAnotherRandomCardCode
        el.buttonForShowingPrevTriedRandomCode = buttonDOMForShowingPrevTriedRandomCode
        el.buttonForShowingNextTriedRandomCode = buttonDOMForShowingNextTriedRandomCode
        el.valueSlotOfShowingIndexOfTriedRandomCodes = valueSlotDOM


        this.parseRawKnownCardCodes(knownCardCodeStrings)
        this.buildCardBordersViaKnownCardCodeName(initialKnownCardCodeName)
        this.$updateTriedRandomCodesUIStatus(0)

        buttonDOMForTryingAnotherRandomCardCode.addEventListener('click', this.buildCardBordersViaRandomCodes.bind(this))
        buttonDOMForShowingPrevTriedRandomCode.addEventListener('click', this.gotoPrevTriedRandomCodes.bind(this))
        buttonDOMForShowingNextTriedRandomCode.addEventListener('click', this.gotoNextTriedRandomCodes.bind(this))

        intervalInSeconds = parseFloat(intervalInSeconds)
        if (intervalInSeconds > 0) {
            this.options.intervalInSeconds = intervalInSeconds
        }

        if (shouldStartIntervalAtBeginning) {
            this.startInterval()
        }

        return true
    },

    $printCodeArray(title, codes) {
        console.log(title,
            `\n    ${
                codes[0]
            }\n    ${
                codes[1]
            }\n    ${
                codes[2]
            }\n    ${
                codes[3]
            }`
        )
    },

    parseRawKnownCardCodes(knownCardCodeStrings) {
        const parsedKnownCardCodes = {}
        const knownCardCodeNames = Object.keys(knownCardCodeStrings)
        knownCardCodeNames.forEach(cardCodeName => {
            const codes = knownCardCodeStrings[cardCodeName]
            parsedKnownCardCodes[cardCodeName] = codes.map(borderCodeString => {
                return borderCodeString.split('').map(char => parseInt(char, 10))
            })
        })

        this.data.knownCardCodes = parsedKnownCardCodes

        const manuallyFixedBits = window.jiJiaCardCodesManuallyFixedBits
        let parsedManuallyFixedBits = null
        if (manuallyFixedBits) {
            parsedManuallyFixedBits = manuallyFixedBits.map(border => {
                if (!border) { return null }
                return border.split('').map(bit => bit !== '_' ? bit : undefined)
            })
            this.data.manuallyFixedBits = parsedManuallyFixedBits
            this.$printCodeArray('Manually fixed bits:', parsedManuallyFixedBits)
        }

        let autoDetectedFixedBits
        if (knownCardCodeNames.length > 3) {
            const firstParsedCode = parsedKnownCardCodes[knownCardCodeNames[0]]
            autoDetectedFixedBits = [
                [...firstParsedCode[0]],
                [...firstParsedCode[1]],
                [...firstParsedCode[2]],
                [...firstParsedCode[3]],
            ]

            knownCardCodeNames.slice(1).forEach(cardCodeName => {
                const cardCodes = parsedKnownCardCodes[cardCodeName]
                cardCodes.forEach((cardBorder, cardBorderIndex) => {
                    cardBorder.forEach((codeBit, codeBitIndex) => {
                        const consistentCodeValueOfThisBit = autoDetectedFixedBits[cardBorderIndex][codeBitIndex]
                        if (consistentCodeValueOfThisBit !== undefined) {
                            if (consistentCodeValueOfThisBit !== codeBit) {
                                autoDetectedFixedBits[cardBorderIndex][codeBitIndex] = undefined
                            }
                        }
                    })
                })
            })

            const countOfConsistentBits = autoDetectedFixedBits.reduce((_countOfConsistentBits, border) => {
                return _countOfConsistentBits + border.reduce((_countOfConsistentBitsInBorder, bit) => {
                    return _countOfConsistentBitsInBorder + (bit === undefined ? 0 : 1)
                }, 0)
            }, 0)

            this.$printCodeArray('Consistent bits across all known codes:', autoDetectedFixedBits)
            console.log('Consistent bits count:', countOfConsistentBits)

            this.data.autoDetectedFixedBitsAcrossAllKnownCards = autoDetectedFixedBits
        }

        if (parsedManuallyFixedBits || autoDetectedFixedBits) {
            let fixedBits

            if (parsedManuallyFixedBits && autoDetectedFixedBits) {
                fixedBits = autoDetectedFixedBits.map((consistentBorder, borderIndex) => {
                    const manuallyFixedBorder =  parsedManuallyFixedBits[borderIndex]
                    if (!manuallyFixedBorder) {
                        return consistentBorder
                    }

                    return consistentBorder.map((bit, bitIndex) => {
                        if (bit !== undefined) {
                            return bit
                        }
                        manuallyBit = manuallyFixedBorder[bitIndex]
                        if (manuallyBit !== undefined) {
                            return manuallyBit
                        }
                        return undefined
                    })
                })
            } else if (parsedManuallyFixedBits) {
               fixedBits = parsedManuallyFixedBits
            } else {
               fixedBits = autoDetectedFixedBits
            }

            const countOfFixedBits = fixedBits.reduce((_countOfFixedBits, border) => {
                return _countOfFixedBits + border.reduce((_countOfFixedBitsInBorder, bit) => {
                    return _countOfFixedBitsInBorder + (bit === undefined ? 0 : 1)
                }, 0)
            }, 0)

            this.$printCodeArray('Decided fixed bits:', fixedBits)
            console.log('Fixed bits count:', countOfFixedBits, '\tvariable bits count:', 36 - countOfFixedBits)
            this.data.fixedBits = fixedBits
        }
    },

    startInterval() {
        if (this.status.intervalId) { return }

        this.status.intervalId = setInterval(
            this.buildCardBordersViaRandomCodes.bind(this),
            this.options.intervalInSeconds * 1000
        )
    },

    stopInterval() {
        if (isNaN(this.status.intervalId)) { return }
        clearInterval(this.status.intervalId)
    },

    clearCardBorders() {
        const { classNames, el } = this
        const rootDOM = el.root
        const borderDotDOMs = Array.prototype.slice.apply(
            rootDOM.querySelectorAll(
                `.${classNames.bordersCommon} .${classNames.borderDotsCommon}`
            )
        )

        borderDotDOMs.forEach(dom => dom.parentNode.removeChild(dom))
    },

    buildCardBordersViaKnownCardCodeName(cardCodeName) {
        const cardCodes = this.data.knownCardCodes[cardCodeName]
        if (cardCodes) {
            this.status.isShowingRandomCodes = false
            this.$updateCardCodeDOMs(cardCodes, cardCodeName)
        }
    },

    buildCardBordersViaRandomCodes() {
        const randomCardCodes = [
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
        ]

        // this.$printCodeArray('random codes (before applying fixed values):', randomCardCodes)
        const { fixedBits } = this.data
        if (fixedBits) {
            fixedBits.forEach((border, borderIndex) => {
                border.forEach((bit, bitIndex) => {
                    if (bit !== undefined) {
                        randomCardCodes[borderIndex][bitIndex] = bit
                    }
                })
            })
        }
        // this.$printCodeArray('random codes (after applying fixed values):', randomCardCodes)


        const cardCodeName = this.options.$randomCardCodeName
        this.data.triedCodes.push(randomCardCodes)
        this.gotoTriedRandomCodesOfIndex(this.data.triedCodes.length - 1)
    },

    gotoTriedRandomCodesOfIndex(desiredIndex) {
        const { triedCodes } = this.data
        const existingCodesCount = triedCodes.length
        if (desiredIndex >= 0 && desiredIndex <= existingCodesCount - 1) {
            const { status } = this
            if (status.triedCodesShowingIndex !== desiredIndex || !status.isShowingRandomCodes) {
                status.triedCodesShowingIndex = desiredIndex
                status.isShowingRandomCodes = true
                this.$updateTriedRandomCodesUIStatus()

                const cardCodesToShow = triedCodes[desiredIndex]
                const cardCodeName = this.options.$randomCardCodeName
                this.$updateCardCodeDOMs(cardCodesToShow, cardCodeName)
            }
        }
    },

    gotoPrevTriedRandomCodes() {
        this.gotoTriedRandomCodesOfIndex(this.status.triedCodesShowingIndex - 1)
    },
    
    gotoNextTriedRandomCodes() {
        this.gotoTriedRandomCodesOfIndex(this.status.triedCodesShowingIndex + 1)
    },

    $updateTriedRandomCodesUIStatus() {
        const { el } = this
        const { triedCodes } = this.data
        const existingCodesCount = triedCodes.length
        const currentIndex = this.status.triedCodesShowingIndex
        const valueSlotDOM = el.valueSlotOfShowingIndexOfTriedRandomCodes
        const {
            buttonForShowingPrevTriedRandomCode,
            buttonForShowingNextTriedRandomCode,
        } = el


        if (existingCodesCount < 1) {
            valueSlotDOM.textContent = 'none'
            buttonForShowingPrevTriedRandomCode.disabled = true
            buttonForShowingNextTriedRandomCode.disabled = true
        } else if (currentIndex >= 0 && currentIndex <= existingCodesCount - 1) {
            const displayIndex = currentIndex + 1
            valueSlotDOM.textContent = `${displayIndex}/${existingCodesCount}`

            buttonForShowingPrevTriedRandomCode.disabled = currentIndex < 1
            buttonForShowingNextTriedRandomCode.disabled = currentIndex >= existingCodesCount - 1
        }
    },

    $updateCardCodeDOMs(cardCodesToShow, cardCodeName) {
        this.clearCardBorders()
        const { classNames, el } = this
        const rootDOM = el.root

        if (!Array.isArray(cardCodesToShow) || cardCodesToShow.length !== 4) {
            console.error('Invalid code setup')
            return
        }

        const shouldPrintCodesInConsole = true
        if (shouldPrintCodesInConsole) {
            this.$printCodeArray('Applying codes:', cardCodesToShow)
        }


        let backgroundImageURL = ''
        if (cardCodeName && cardCodeName !== 'new random code') {
            backgroundImageURL = `url(${window.jiJiaPreviewImageURLsPrefix}/${cardCodeName}.jpg)`
        }

        el.cardPreviewDOM.style.backgroundImage = backgroundImageURL


        cardCodesToShow.forEach((borderSetup, index) => {
            const borderName = classNames.borderNames[index]
            const borderDOM = rootDOM.querySelector(`.${classNames.bordersNamePrefix}${borderName}`)

            borderSetup.map(bool => {
                const borderDotDOM = document.createElement('div')
                const classNameOfStatus = bool ?
                    classNames.borderDotOfFilled :
                    classNames.borderDotOfEmpty;

                borderDotDOM.classList.add(classNames.borderDotsCommon)
                borderDotDOM.classList.add(classNameOfStatus)
                borderDOM.appendChild(borderDotDOM)
            })
        })
    }
}

function generateRandomBooleanArray(count) {
    const booleans = []
    for (let i=0; i<count; i++) {
        booleans.push(Math.round(Math.random()))
    }
    return booleans
}
