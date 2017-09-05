import container from "./ioc"
import browserSettings from "./browser"
import accounts from "./accounts"

const settings = {
    browser: browserSettings,
    crowdcube: {
        accounts: accounts.crowdcube
    }
}

export {container, settings}