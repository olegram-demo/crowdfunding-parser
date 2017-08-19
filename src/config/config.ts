import container from "./ioc"
import accounts from "./accounts"

const settings = {
    crowdcube: {
        accounts: accounts.crowdcube
    }
}

export {container, settings}