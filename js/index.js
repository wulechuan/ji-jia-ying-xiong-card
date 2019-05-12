(function () {
    const cardCodesManager = window.cardCodesManager
    let pageLoadingHanlerHasInvoked = false
    document.addEventListener('load', onPageLoad)
    onPageLoad()

    function onPageLoad() {
        if (!document.body || pageLoadingHanlerHasInvoked) { return }
        pageLoadingHanlerHasInvoked = true
        startApp()
    }








    function startApp() {
        const knownCardCodeStrings = window.knownCardCodeStrings
        initCardCodesManager()





        function initCardCodesManager() {
            const succeeded = cardCodesManager.init({
                knownCardCodeStrings: knownCardCodeStrings,
                initialKnownCardCodeName: Object.keys(knownCardCodeStrings)[0],
                shouldStartIntervalAtBeginning: false,
            })

            if (succeeded) {
                buildButtonsForApplyingKnownCardCodes()
                bindMoreDOMEvents()
            }

            return succeeded
        }

        function buildButtonsForApplyingKnownCardCodes() {
            const buttonContainerDOM = document.querySelector('.known-card-code-buttons')
            if (!buttonContainerDOM) {
                console.log('DOM of class ".known-card-code-buttons" not found.')
                return false
            }

            const knownJiJiaRoleImageURLPrefix = window.knownJiJiaRoleImageURLPrefix

            Object.keys(knownCardCodeStrings).forEach(cardCodeName => {
                const buttonDOM = document.createElement('button')
                const buttonPreviewDOM = document.createElement('span')
                const buttonLabelDOM = document.createElement('span')

                buttonDOM.classList.add('button-for-applying-known-card-code')

                const backgroundImageURL = `url(${knownJiJiaRoleImageURLPrefix}/${cardCodeName}.jpg)`
                buttonDOM.addEventListener('click', function (event) {
                    cardCodesManager.buildCardBordersViaKnownCardCodeName(cardCodeName)
                })


                buttonPreviewDOM.classList.add('ji-jia-preview')
                buttonPreviewDOM.style.backgroundImage = backgroundImageURL


                buttonLabelDOM.classList.add('label')
                buttonLabelDOM.textContent = cardCodeName


                buttonDOM.appendChild(buttonPreviewDOM)
                buttonDOM.appendChild(buttonLabelDOM)
                buttonContainerDOM.appendChild(buttonDOM)
            })
        }

        function bindMoreDOMEvents() {
            const bodyDOM = document.body
            const buttonDOMForNewTry = bodyDOM.querySelector('.button-for-trying-another-random-card-code')
            if (buttonDOMForNewTry) {
                buttonDOMForNewTry.addEventListener('click', function (event) {
                    cardCodesManager.buildCardBordersViaRandomCodes()
                })
            }
        }
    }
})()
