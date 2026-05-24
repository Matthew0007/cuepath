import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function VerifyPage() {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <div className="text-4xl mb-2">📧</div>
        <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
        <CardDescription>
          입력하신 이메일로 인증 링크를 보냈습니다.
          <br />
          링크를 클릭하면 가입이 완료됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
          로그인 페이지로
        </Link>
      </CardContent>
    </Card>
  )
}
