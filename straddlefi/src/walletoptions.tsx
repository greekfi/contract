import * as React from 'react'
import { Connector, useConnect } from 'wagmi'
import { Button, Card, Form, Space } from 'antd'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return (

    <Card className="max-w-2xl mx-auto">
      <Form layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {connectors.map((connector) => (
            <WalletOption
              key={connector.uid}
              connector={connector}
              onClick={() => connect({ connector })}
            />
          ))}
        </Space>
      </Form>
    </Card>
  )
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <Button
      type="default"
      size="large"
      disabled={!ready}
      onClick={onClick}
      block
    >
      {connector.name}
    </Button>
  )
}