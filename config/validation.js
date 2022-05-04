module.exports = {
    //data must be array contain of object

    validate(data) {
        let isValid = true
        let needValidate = data 
        if (!Array.isArray(needValidate)) {
            throw new Error("Argument must be an array")
        }
        const validationError = needValidate.reduce((prev, cur) => {
            if (typeof cur !== 'object') {
                return prev
            }
            for (const props in cur) {
                let value = cur[props]
                if (typeof value == 'string') {
                    if (!value.trim()) {
                        isValid = false
                        prev.push(`Please fill the field '${props.toString()}'`)
                    }
                }
                else {
                    if (value == undefined || value == null) {
                        isValid = false
                        prev.push(`Please fill the field '${props.toString()}'`)
                    }
                }
            }
            return prev.concat([])
        }, [])
        return {
            isValid,
            validationError
        }

    },
    trimValidate(data) {
        let isValid = true
        let needValidate = data 
        if (!Array.isArray(needValidate)) {
            throw new Error("Argument must be an array")
        }
        const validationError = needValidate.reduce((prev, cur) => {
            if (typeof cur !== 'object') {
                return prev
            }
            for (const props in cur) {
                let value = cur[props]
                if (typeof value == 'string') {
                    if (!value.trim()) {
                        isValid = false
                        prev.push(`Field must not contain only blank space. '${props.toString()}'  has only blank space`)
                    }
                }
            }
            return prev.concat([])
        }, [])
        return {
            isValid,
            validationError,
        }
    },
    updateData(data) {
        if (!Array.isArray(data)) {
            throw new Error("Argument must be an array")
        }
        return data.reduce((prev, cur) => {
            for (const props in cur) {
                if (typeof cur !== 'object') {
                    return prev
                }
                let value = cur[props]
                if (typeof value == 'string') {
                    if (Boolean(value.trim())) {
                        prev[props] = value
                    }
                }
                else {
                    if (value != undefined && value != null) {
                        prev[props] = value
                    }
                }
            }
            return prev
        }, {})
    }
}
