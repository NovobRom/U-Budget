
import React from 'react';
import { Loader2 } from 'lucide-react';
import { CURRENCIES } from '../../../constants.js';

export default function AmountInput(props) {
    console.log(CURRENCIES);
    if (!props.isOpen && !props.amount) return null;
    return <div>Dummy Amount Input <Loader2 /></div>;
}
