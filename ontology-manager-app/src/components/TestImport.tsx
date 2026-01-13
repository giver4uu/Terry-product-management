import React from 'react';
import { TestComponent } from './TestComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestImport() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Test Import</CardTitle>
        </CardHeader>
        <CardContent>
          <TestComponent />
        </CardContent>
      </Card>
    </div>
  );
}