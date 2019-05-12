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
    },

    el: {
        // root: null,
        // cardPreviewDOM: null,
    },

    options: {
        intervalInSeconds: 30,
    },

    data: {
        triedCodes: [],
        knownCardCodeFixedValues: null,
    },

    status: {
        intervalId: NaN,
    },

    init({
        knownCardCodeStrings,
        shouldStartIntervalAtBeginning,
        initialKnownCardCodeName,
    }) {
        const { domSelectors, el } = this
        const rootDOM = document.querySelector(domSelectors.root)
        const cardPreviewDOM = document.querySelector(domSelectors.jiJiaPreview)

        if (!rootDOM) {
            console.error('Failed to get DOM root.')
            return false
        }

        if (!cardPreviewDOM) {
            console.error('Failed to get DOM of cardPreview.')
        }

        el.root = rootDOM
        el.cardPreviewDOM = cardPreviewDOM


        this.parseRawKnownCardCodes(knownCardCodeStrings)
        this.buildCardBordersViaKnownCardCodeName(initialKnownCardCodeName)

        shouldStartIntervalAtBeginning && this.startInterval()

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

        if (knownCardCodeNames.length > 3) {
            const firstParsedCode = parsedKnownCardCodes[knownCardCodeNames[0]]
            const consistantCodeValues = [
                [...firstParsedCode[0]],
                [...firstParsedCode[1]],
                [...firstParsedCode[2]],
                [...firstParsedCode[3]],
            ]

            knownCardCodeNames.slice(1).forEach(cardCodeName => {
                const cardCodes = parsedKnownCardCodes[cardCodeName]
                cardCodes.forEach((cardBorder, cardBorderIndex) => {
                    cardBorder.forEach((codeBit, codeBitIndex) => {
                        const consistantCodeValueOfThisBit = consistantCodeValues[cardBorderIndex][codeBitIndex]
                        if (consistantCodeValueOfThisBit !== undefined) {
                            if (consistantCodeValueOfThisBit !== codeBit) {
                                consistantCodeValues[cardBorderIndex][codeBitIndex] = undefined
                            }
                        }
                    })
                })
            })

            const countOfFixedBits = consistantCodeValues.reduce((_countOfFixedBits, border) => {
                return _countOfFixedBits + border.reduce((_countOfFixedBitsInBorder, bit) => {
                    return _countOfFixedBitsInBorder + (bit === undefined ? 0 : 1)
                }, 0)
            }, 0)

            this.$printCodeArray('Consistant bits across all known codes:', consistantCodeValues)
            console.log('Fixed bits count:', countOfFixedBits, '\tvariable bits count:', 36 - countOfFixedBits)

            this.data.knownCardCodeFixedValues = consistantCodeValues
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
        const borderDotsSetups = this.data.knownCardCodes[cardCodeName]
        if (borderDotsSetups) {
            this.$buildCardBordersCore(borderDotsSetups, cardCodeName)
        }
    },

    buildCardBordersViaRandomCodes() {
        const borderDotsSetups = [
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
            generateRandomBooleanArray(9),
        ]
        
        // this.$printCodeArray('random codes (before applying fixed values):', borderDotsSetups)
        const { knownCardCodeFixedValues } = this.data
        if (knownCardCodeFixedValues) {
            knownCardCodeFixedValues.forEach((border, borderIndex) => {
                border.forEach((bit, bitIndex) => {
                    if (bit !== undefined) {
                        borderDotsSetups[borderIndex][bitIndex] = bit
                    }
                })
            })
        }
        // this.$printCodeArray('random codes (after applying fixed values):', borderDotsSetups)


        const cardCodeName = 'new random code'

        this.$buildCardBordersCore(borderDotsSetups, cardCodeName)
        this.data.triedCodes.push(borderDotsSetups)
    },

    $buildCardBordersCore(borderDotsSetups, cardCodeName) {
        this.clearCardBorders()
        const { classNames, el } = this
        const rootDOM = el.root

        if (!Array.isArray(borderDotsSetups) || borderDotsSetups.length !== 4) {
            console.error('Invalid code setup')
            return
        }

        const shouldPrintCodesInConsole = true
        if (shouldPrintCodesInConsole) {
            this.$printCodeArray('Applying codes:', borderDotsSetups)
        }


        let backgroundImageURL = ''
        if (cardCodeName && cardCodeName !== 'new random code') {
            backgroundImageURL = `url(${window.knownJiJiaRoleImageURLPrefix}/${cardCodeName}.jpg)`
        }

        el.cardPreviewDOM.style.backgroundImage = backgroundImageURL


        borderDotsSetups.forEach((borderSetup, index) => {
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