"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import NumberFlow from "@number-flow/react";

export interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingComparisonProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function PricingComparison({
  plans,
  title = "Pricing Comparison",
  description = "Compare plans side-by-side to find the best value for your needs.",
}: PricingComparisonProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
  };

  return (
    <div className="py-10">
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-[#e4e6eb] sm:text-3xl">
          {title}
        </h2>
        <p className="text-[#8b8fa3] text-base whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              checked={!isMonthly}
              onCheckedChange={handleToggle}
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold text-[#e4e6eb]">
          Annual billing <span className="text-[#3B82F6]">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 30, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -12 : 0,
                    opacity: 1,
                    scale: plan.isPopular ? 1.0 : 0.96,
                  }
                : { y: 0, opacity: 1 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.1 * index,
            }}
            className={cn(
              "rounded-2xl border p-6 text-center flex flex-col relative",
              plan.isPopular
                ? "border-[#3B82F6] border-2 bg-[#1a1d27]"
                : "border-[#2a2e3a] bg-[#1a1d27]",
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-[#3B82F6] py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-white h-4 w-4 fill-current" />
                <span className="text-white ml-1 font-semibold text-sm">
                  Popular
                </span>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-[#8b8fa3]">
                {plan.name}
              </p>

              <div className="mt-4 flex items-center justify-center gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-[#e4e6eb]">
                  <NumberFlow
                    value={
                      isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                    }
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                  />
                </span>
                {plan.period !== "one-time" && (
                  <span className="text-sm font-semibold leading-6 text-[#8b8fa3]">
                    / {plan.period}
                  </span>
                )}
              </div>

              <p className="text-xs leading-5 text-[#8b8fa3] mt-1">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-5 gap-2 flex flex-col text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#3B82F6] mt-1 flex-shrink-0" />
                    <span className="text-sm text-[#b0b3c0]">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4 border-[#2a2e3a]" />

              <Link
                href={plan.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group relative w-full gap-2 overflow-hidden text-base font-semibold tracking-tight",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-[#3B82F6] hover:ring-offset-1",
                  plan.isPopular
                    ? "bg-[#3B82F6] text-white border-[#3B82F6] hover:bg-[#2563EB] hover:text-white"
                    : "bg-[#0f1117] text-[#e4e6eb] border-[#2a2e3a] hover:bg-[#3B82F6] hover:text-white hover:border-[#3B82F6]",
                )}
              >
                {plan.buttonText}
              </Link>

              <p className="mt-4 text-xs leading-5 text-[#8b8fa3]">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
